import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { meetingAccess } from '@/lib/video'

// The patient, signed in with BankID, consents to the recording before joining.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await meetingAccess(id)
  if (!access || access.isDentist) return NextResponse.json({ error: 'Ingen åtkomst.' }, { status: 403 })
  if (!access.bankId) return NextResponse.json({ error: 'Logga in med BankID först.' }, { status: 401 })
  if (!access.meeting.recording_consent_at) {
    await createAdminClient().from('video_meetings').update({ recording_consent_at: new Date().toISOString() }).eq('id', id)
  }
  return NextResponse.json({ ok: true })
}
