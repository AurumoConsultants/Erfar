import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasBankIdSession } from '@/lib/video'
import { createMeeting, wherebyConfigured } from '@/lib/whereby'
import { sendNotification } from '@/lib/email'
import { BOOKING_LEAD_MINUTES, formatSlot } from '@/lib/introCalls'

// A patient books a free intro call: claims the slot atomically, then opens
// a Whereby room for it (no recording).
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Logga in för att boka.' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role, full_name, email').eq('id', user.id).single()
  if (profile?.role !== 'patient') return NextResponse.json({ error: 'Endast för patienter.' }, { status: 403 })
  if (!(await hasBankIdSession(user.id))) return NextResponse.json({ error: 'Logga in med BankID för att boka.' }, { status: 401 })
  if (!wherebyConfigured()) return NextResponse.json({ error: 'Videosamtal är inte aktiverat.' }, { status: 503 })

  const { slotId } = await req.json().catch(() => ({}))
  if (typeof slotId !== 'string') return NextResponse.json({ error: 'Välj en tid.' }, { status: 400 })

  const admin = createAdminClient()
  const now = Date.now()
  const { data: existing } = await admin.from('intro_call_slots').select('id')
    .eq('booked_by', user.id).gt('starts_at', new Date(now - 30 * 60_000).toISOString()).limit(1)
  if (existing?.length) return NextResponse.json({ error: 'Du har redan ett bokat startsamtal. Avboka det först om du vill byta tid.' }, { status: 409 })

  const { data: slot } = await admin.from('intro_call_slots')
    .update({ booked_by: user.id, booked_at: new Date().toISOString() })
    .eq('id', slotId).is('booked_by', null).gt('starts_at', new Date(now + BOOKING_LEAD_MINUTES * 60_000).toISOString())
    .select('id, starts_at, duration_minutes').maybeSingle()
  if (!slot) return NextResponse.json({ error: 'Tiden är inte längre ledig. Välj en annan.' }, { status: 409 })

  try {
    const meeting = await createMeeting(new Date(new Date(slot.starts_at).getTime() + 60 * 60_000), { record: false })
    await admin.from('intro_call_slots').update({
      whereby_meeting_id: meeting.meetingId, room_url: meeting.roomUrl, host_room_url: meeting.hostRoomUrl,
    }).eq('id', slot.id)
  } catch (e) {
    console.error('intro call room', e)
    await admin.from('intro_call_slots').update({ booked_by: null, booked_at: null }).eq('id', slot.id)
    return NextResponse.json({ error: 'Kunde inte skapa videorummet. Försök igen.' }, { status: 502 })
  }

  const when = formatSlot(slot.starts_at)
  const { data: dentists } = await admin.from('profiles').select('email').eq('role', 'tandlakare')
  await Promise.all([
    sendNotification(profile.email, `Startsamtal bokat ${when}`,
      `Hej ${profile.full_name},\n\nDitt kostnadsfria startsamtal med Doktor Sylvia är bokat ${when} (${slot.duration_minutes} minuter). Anslut via länken nedan när det är dags.`,
      `/startsamtal/${slot.id}`),
    ...(dentists ?? []).map(d => sendNotification(d.email, `Nytt startsamtal ${when}`,
      `${profile.full_name} har bokat ett startsamtal ${when}.`, '/granskning/startsamtal')),
  ]).catch(e => console.error('intro call mail', e))

  return NextResponse.json({ id: slot.id })
}
