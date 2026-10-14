import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dentistOrError } from '@/lib/apiAuth'
import { sendNotification } from '@/lib/email'
import { createMeeting, wherebyConfigured } from '@/lib/whereby'

// The dentist books a video consultation on a case.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const dentist = await dentistOrError()
  if (dentist instanceof NextResponse) return dentist
  if (!wherebyConfigured()) return NextResponse.json({ error: 'Videotjänsten är inte konfigurerad (WHEREBY_API_KEY).' }, { status: 503 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const scheduledAt = new Date(body.scheduledAt)
  const duration = Number(body.durationMinutes) || 20
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now() - 5 * 60_000) {
    return NextResponse.json({ error: 'Välj en tid framåt i tiden.' }, { status: 400 })
  }
  if (duration < 5 || duration > 120) return NextResponse.json({ error: 'Ogiltig längd.' }, { status: 400 })

  const supabase = await createClient()
  const { data: c } = await supabase.from('cases').select('id, patient_id').eq('id', id).maybeSingle()
  if (!c) return NextResponse.json({ error: 'Ärendet hittades inte.' }, { status: 404 })

  // The room stays open an hour past the planned end so a late start still works.
  const endDate = new Date(scheduledAt.getTime() + (duration + 60) * 60_000)
  let room
  try {
    room = await createMeeting(endDate)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Kunde inte skapa videorummet hos Whereby.' }, { status: 502 })
  }

  const { data: meeting, error } = await createAdminClient().from('video_meetings').insert({
    case_id: id, patient_id: c.patient_id, created_by: dentist.id,
    scheduled_at: scheduledAt.toISOString(), duration_minutes: duration,
    whereby_meeting_id: room.meetingId, room_name: room.roomName, room_url: room.roomUrl, host_room_url: room.hostRoomUrl,
  }).select('id').single()
  if (error || !meeting) return NextResponse.json({ error: 'Kunde inte spara bokningen.' }, { status: 500 })

  const { data: patient } = await supabase.from('profiles').select('email').eq('id', c.patient_id).maybeSingle()
  const when = scheduledAt.toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm', dateStyle: 'full', timeStyle: 'short' })
  const mail = await sendNotification(
    patient?.email,
    'Videosamtal med Doktor Sylvia är bokat',
    `Ditt videosamtal är bokat ${when}. Du ansluter från Tandsmart och loggar in med BankID. Samtalet spelas in och sparas i din profil så att du kan se det igen.`,
    `/video/${meeting.id}`,
  )
  return NextResponse.json({ ok: true, id: meeting.id, emailed: mail.sent })
}
