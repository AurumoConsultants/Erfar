import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { meetingAccess } from '@/lib/video'
import { recordingAccessLink } from '@/lib/whereby'

// Plays a recording: checks access, logs it, then redirects to a short-lived
// Whereby link. Patients must be signed in with BankID.
export async function GET(_req: Request, { params }: { params: Promise<{ recordingId: string }> }) {
  const { recordingId } = await params
  const admin = createAdminClient()
  const { data: rec } = await admin.from('video_recordings').select('meeting_id, whereby_recording_id').eq('id', recordingId).maybeSingle()
  if (!rec) return NextResponse.json({ error: 'Hittades inte.' }, { status: 404 })
  const access = await meetingAccess(rec.meeting_id)
  if (!access) return NextResponse.json({ error: 'Ingen åtkomst.' }, { status: 403 })
  if (!access.isDentist && !access.bankId) return NextResponse.json({ error: 'Logga in med BankID för att se inspelningen.' }, { status: 401 })

  await admin.from('case_access_log').insert({ case_id: access.meeting.case_id, profile_id: access.profile.id, action: 'video_recording' })
  try {
    return NextResponse.redirect(await recordingAccessLink(rec.whereby_recording_id), { status: 302 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Inspelningen kunde inte hämtas.' }, { status: 502 })
  }
}
