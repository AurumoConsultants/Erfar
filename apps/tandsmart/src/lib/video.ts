import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { BANKID_COOKIE, bankIdEnabled, verifyBankIdSession } from '@/lib/bankid'
import { listRecordings } from '@/lib/whereby'

export interface VideoMeeting {
  id: string
  case_id: string
  patient_id: string
  scheduled_at: string
  duration_minutes: number
  status: 'bokad' | 'genomford' | 'avbokad'
  room_name: string
  recording_consent_at: string | null
  recordings: { id: string; started_at: string | null; ended_at: string | null }[]
}

export const MEETING_COLUMNS =
  'id, case_id, patient_id, scheduled_at, duration_minutes, status, room_name, recording_consent_at, recordings:video_recordings(id, started_at, ended_at)'

// Does the current request meet the BankID requirement as `userId`? Always
// true while BankID is switched off.
export async function hasBankIdSession(userId: string) {
  if (!bankIdEnabled()) return true
  return verifyBankIdSession((await cookies()).get(BANKID_COOKIE)?.value, userId)
}

// The caller and their relation to a meeting, or null if they may not see it.
export async function meetingAccess(meetingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const [{ data: profile }, { data: meeting }] = await Promise.all([
    supabase.from('profiles').select('id, role, full_name, bankid_verified_at').eq('id', user.id).single(),
    // Service role read; the ownership check below decides access.
    createAdminClient().from('video_meetings').select('*').eq('id', meetingId).maybeSingle(),
  ])
  if (!profile || !meeting) return null
  const isDentist = profile.role === 'tandlakare'
  if (!isDentist && meeting.patient_id !== user.id) return null
  return { profile, meeting, isDentist, bankId: await hasBankIdSession(user.id) }
}

// Copies Whereby's recording list for a meeting into video_recordings.
export async function syncRecordings(meeting: { id: string; room_name: string }) {
  const recs = await listRecordings(meeting.room_name)
  if (!recs.length) return 0
  await createAdminClient().from('video_recordings').upsert(
    recs.map(r => ({ meeting_id: meeting.id, whereby_recording_id: r.recordingId, started_at: r.startDate ?? null, ended_at: r.endDate ?? null })),
    { onConflict: 'whereby_recording_id', ignoreDuplicates: true },
  )
  return recs.length
}
