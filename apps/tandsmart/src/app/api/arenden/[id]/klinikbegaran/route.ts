import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/email'
import { CLINIC_LINK_DAYS, REQUESTABLE_ITEMS, buildConsentText } from '@/lib/clinicRequest'
import { newToken } from '@/lib/clinicRequestServer'
import { hasBankIdSession } from '@/lib/video'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Patient asks their clinic to send journal/röntgen straight to the case.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ej inloggad.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const clinicName = String(body.clinicName ?? '').trim()
  const clinicEmail = String(body.clinicEmail ?? '').trim().toLowerCase()
  // The clinic releases records on the patient's consent, so the patient must
  // be signed in with BankID right now; the personnummer comes from BankID.
  const { data: profile } = await supabase.from('profiles')
    .select('full_name, personnummer, bankid_name, bankid_verified_at').eq('id', user.id).single()
  if (!profile?.personnummer || !profile.bankid_verified_at || !(await hasBankIdSession(user.id))) {
    return NextResponse.json({ error: 'Logga in med BankID för att skicka en begäran till kliniken.' }, { status: 403 })
  }
  const personnummer = profile.personnummer
  const items: string[] = Array.isArray(body.items) ? body.items.filter((i: unknown) => REQUESTABLE_ITEMS.some(r => r.value === i)) : []
  const period = String(body.period ?? '').trim().slice(0, 100) || null

  if (!clinicName || clinicName.length > 200) return NextResponse.json({ error: 'Ange klinikens namn.' }, { status: 400 })
  if (!EMAIL_RE.test(clinicEmail)) return NextResponse.json({ error: 'Ange klinikens e-postadress.' }, { status: 400 })
  if (items.length === 0) return NextResponse.json({ error: 'Välj vad kliniken ska skicka.' }, { status: 400 })
  if (body.consent !== true) return NextResponse.json({ error: 'Du behöver lämna ditt samtycke.' }, { status: 400 })

  const { data: c } = await supabase.from('cases').select('id, patient_id, status').eq('id', id).maybeSingle()
  if (!c || c.patient_id !== user.id) return NextResponse.json({ error: 'Ärendet hittades inte.' }, { status: 404 })
  if (c.status === 'besvarat' || c.status === 'avslutat') {
    return NextResponse.json({ error: 'Ärendet är redan besvarat.' }, { status: 400 })
  }
  const patientName = profile.bankid_name || profile.full_name || 'Patienten'

  const consentText = buildConsentText({ patientName, personnummer, clinicName, items, period })
  const { token, hash } = newToken()
  const expires = new Date(Date.now() + CLINIC_LINK_DAYS * 86_400_000)

  // Service role: patients can't insert requests directly (migration 00010).
  const admin = createAdminClient()
  const { data: created, error } = await admin.from('clinic_requests').insert({
    case_id: id, created_by: user.id, clinic_name: clinicName, clinic_email: clinicEmail,
    patient_name: patientName, patient_personnummer: personnummer, requested_items: items, period,
    consent_text: consentText, consented_at: new Date().toISOString(), token_hash: hash,
    expires_at: expires.toISOString(), bankid_verified_at: profile.bankid_verified_at, bankid_name: profile.bankid_name,
  }).select('id').single()
  if (error || !created) return NextResponse.json({ error: 'Kunde inte skapa begäran.' }, { status: 500 })

  const path = `/klinik/${token}`
  const mail = await sendNotification(
    clinicEmail,
    `Begäran om journalkopia — ${patientName}`,
    `Hej ${clinicName},\n\n${patientName} har legitimerat sig med BankID och gett sitt samtycke till att ni skickar kopior av ${items.length > 1 ? 'journaluppgifter och bilder' : 'journaluppgifter'} till Tandsmart för en second opinion hos legitimerad tandläkare. `
      + `Via länken nedan ser ni patientens samtycke och kan ladda upp filerna säkert — ingen inloggning behövs. Länken gäller till ${expires.toLocaleDateString('sv-SE')}.`,
    path,
  )
  if (mail.sent) await admin.from('clinic_requests').update({ email_sent: true }).eq('id', created.id)

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin).replace(/\/$/, '')
  return NextResponse.json({ ok: true, emailed: mail.sent, link: `${appUrl}${path}` })
}
