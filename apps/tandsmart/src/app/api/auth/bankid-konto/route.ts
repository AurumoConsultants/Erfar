import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  BANKID_COOKIE, BANKID_PENDING_COOKIE, BANKID_SESSION_SECONDS, readPendingIdentity, signBankIdSession,
} from '@/lib/bankid'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Creates a patient account from a BankID-verified identity (parked in a
// signed cookie by the BankID callback) plus the e-mail and consent given on
// /auth/registrera/bankid, then signs the new account in.
export async function POST(req: Request) {
  const cookieStore = await cookies()
  const identity = readPendingIdentity(cookieStore.get(BANKID_PENDING_COOKIE)?.value)
  if (!identity) return NextResponse.json({ error: 'BankID-legitimeringen har gått ut. Börja om.' }, { status: 401 })

  const { email: rawEmail, consent } = await req.json().catch(() => ({}))
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : ''
  if (!EMAIL.test(email) || email.length > 254) return NextResponse.json({ error: 'Ange en giltig e-postadress.' }, { status: 400 })
  if (consent !== true) return NextResponse.json({ error: 'Samtycket krävs.' }, { status: 400 })

  const admin = createAdminClient()
  const { data: existing } = await admin.from('profiles').select('id').eq('personnummer', identity.personnummer).maybeSingle()
  if (existing) return NextResponse.json({ error: 'Det finns redan ett konto med ditt BankID. Logga in med BankID.' }, { status: 409 })

  const now = new Date().toISOString()
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true, // identity is BankID-verified; the password is never used
    password: randomBytes(32).toString('base64url'),
    user_metadata: { full_name: identity.name, birth_year: identity.personnummer.slice(0, 4), consent_at: now },
  })
  if (error || !created.user) {
    const taken = /already|registered|exists/i.test(error?.message ?? '')
    return NextResponse.json({
      error: taken
        ? 'E-postadressen används redan. Logga in med den och koppla BankID under Min profil.'
        : 'Kunde inte skapa kontot. Försök igen.',
    }, { status: taken ? 409 : 500 })
  }

  const { error: idError } = await admin.from('profiles').update({
    personnummer: identity.personnummer, bankid_name: identity.name, bankid_verified_at: now,
  }).eq('id', created.user.id)
  if (idError) {
    await admin.auth.admin.deleteUser(created.user.id)
    return NextResponse.json({ error: 'Kunde inte skapa kontot. Försök igen.' }, { status: 500 })
  }

  // Sign the new account in on this request.
  const { data: link } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  const supabase = await createClient()
  const { error: otpError } = link?.properties?.hashed_token
    ? await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: link.properties.hashed_token })
    : { error: new Error('no token') }
  cookieStore.delete(BANKID_PENDING_COOKIE)
  if (otpError) return NextResponse.json({ ok: true, next: '/auth/login?bankid=konto-skapat' })

  cookieStore.set(BANKID_COOKIE, signBankIdSession(created.user.id), {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: BANKID_SESSION_SECONDS,
  })
  return NextResponse.json({ ok: true, next: '/arenden/nytt' })
}
