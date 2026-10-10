import { NextResponse } from 'next/server'
import { meetingAccess, syncRecordings } from '@/lib/video'

// Refreshes the recording list for a meeting (Whereby finishes processing a
// little after the call ends).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await meetingAccess(id)
  if (!access) return NextResponse.json({ error: 'Ingen åtkomst.' }, { status: 403 })
  try {
    return NextResponse.json({ ok: true, recordings: await syncRecordings(access.meeting) })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Kunde inte hämta inspelningar.' }, { status: 502 })
  }
}
