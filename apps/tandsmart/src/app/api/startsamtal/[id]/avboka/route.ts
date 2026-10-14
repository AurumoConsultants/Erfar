import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dentistHasBankId } from '@/lib/auth'
import { deleteMeeting } from '@/lib/whereby'

// Cancels a booked intro call (the patient's own, or any as dentist). The
// time becomes bookable again.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ej inloggad.' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isDentist = profile?.role === 'tandlakare'
  if (isDentist && !(await dentistHasBankId(user.id))) return NextResponse.json({ error: 'Logga in med BankID.' }, { status: 401 })

  const admin = createAdminClient()
  const { data: slot } = await admin.from('intro_call_slots').select('id, booked_by, whereby_meeting_id').eq('id', id).maybeSingle()
  if (!slot?.booked_by || (!isDentist && slot.booked_by !== user.id)) {
    return NextResponse.json({ error: 'Bokningen hittades inte.' }, { status: 404 })
  }
  if (slot.whereby_meeting_id) await deleteMeeting(slot.whereby_meeting_id).catch(e => console.error(e))
  await admin.from('intro_call_slots').update({
    booked_by: null, booked_at: null, whereby_meeting_id: null, room_url: null, host_room_url: null,
  }).eq('id', id)
  return NextResponse.json({ ok: true })
}
