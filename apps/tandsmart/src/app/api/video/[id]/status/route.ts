import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { meetingAccess, syncRecordings } from '@/lib/video'
import { deleteMeeting } from '@/lib/whereby'

// Dentist marks a meeting done (and fetches its recordings) or cancels it.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await meetingAccess(id)
  if (!access?.isDentist) return NextResponse.json({ error: 'Endast för granskande tandläkare.' }, { status: 403 })
  const { status } = await req.json().catch(() => ({}))
  if (status !== 'genomford' && status !== 'avbokad') return NextResponse.json({ error: 'Ogiltig status.' }, { status: 400 })

  if (status === 'avbokad') await deleteMeeting(access.meeting.whereby_meeting_id).catch(e => console.error(e))
  await createAdminClient().from('video_meetings').update({ status }).eq('id', id)
  const recordings = status === 'genomford' ? await syncRecordings(access.meeting).catch(e => { console.error('whereby sync', e); return 0 }) : 0
  return NextResponse.json({ ok: true, recordings })
}
