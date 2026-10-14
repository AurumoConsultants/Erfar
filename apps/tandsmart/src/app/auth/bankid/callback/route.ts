import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  BANKID_COOKIE, BANKID_PENDING_COOKIE, BANKID_SESSION_SECONDS, OIDC_COOKIE, PENDING_SECONDS,
  completeLogin, signBankIdSession, signPendingIdentity,
} from '@/lib/bankid'

// Back from the e-ID broker. Verifies the ID token, then either links BankID
// to the signed-in account or signs in the account that already has this
// personnummer. Unknown personnummer → new-account step.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const cookieStore = await cookies()
  // Signed-in users land on their profile with the message, others on login.
  const fail = (reason: string) => NextResponse.redirect(new URL(`/auth/login?bankid=${reason}&next=/profil`, url))

  const saved = cookieStore.get(OIDC_COOKIE)?.value
  cookieStore.delete({ name: OIDC_COOKIE, path: '/auth/bankid' })
  if (!saved) return fail('avbrutet')
  const { state, nonce, next } = JSON.parse(saved) as { state: string; nonce: string; next: string }
  const code = url.searchParams.get('code')
  if (!code || url.searchParams.get('state') !== state) return fail(url.searchParams.get('error') ? 'avbrutet' : 'fel')

  let identity
  try {
    identity = await completeLogin(code, `${url.origin}/auth/bankid/callback`, nonce)
  } catch (e) {
    console.error('bankid', e)
    return fail('fel')
  }

  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: owner } = await admin.from('profiles').select('id, email').eq('personnummer', identity.personnummer).maybeSingle()

  let userId: string
  if (user) {
    // Link: the personnummer may belong to this account only.
    if (owner && owner.id !== user.id) return fail('annat-konto')
    const { error } = await admin.from('profiles').update({
      personnummer: identity.personnummer, bankid_name: identity.name, bankid_verified_at: new Date().toISOString(),
    }).eq('id', user.id)
    if (error) return fail('fel')
    userId = user.id
  } else {
    if (!owner) {
      // New patient: finish the account on /auth/registrera/bankid.
      cookieStore.set(BANKID_PENDING_COOKIE, signPendingIdentity(identity), {
        httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: PENDING_SECONDS,
      })
      return NextResponse.redirect(new URL('/auth/registrera/bankid', url))
    }
    // Sign in that account: mint a one-time magic-link token server-side and
    // redeem it here, which sets the Supabase session cookies.
    const { data: link, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: owner.email })
    if (error || !link.properties?.hashed_token) return fail('fel')
    const { error: otpError } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: link.properties.hashed_token })
    if (otpError) return fail('fel')
    await admin.from('profiles').update({ bankid_name: identity.name, bankid_verified_at: new Date().toISOString() }).eq('id', owner.id)
    userId = owner.id
  }

  cookieStore.set(BANKID_COOKIE, signBankIdSession(userId), {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: BANKID_SESSION_SECONDS,
  })
  return NextResponse.redirect(new URL(next, url))
}
