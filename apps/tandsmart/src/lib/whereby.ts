// Whereby Embedded (EU-hosted video). Server-only: needs WHEREBY_API_KEY.
// All Whereby calls live here so the request shapes are in one place.

const API = 'https://api.whereby.dev/v1'

export function wherebyConfigured() {
  return Boolean(process.env.WHEREBY_API_KEY)
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.WHEREBY_API_KEY}`, 'Content-Type': 'application/json', ...init.headers },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Whereby ${path}: ${res.status} ${await res.text().catch(() => '')}`)
  return res.status === 204 ? (undefined as T) : res.json() as Promise<T>
}

export interface CreatedMeeting { meetingId: string; roomName: string; roomUrl: string; hostRoomUrl: string }

// A one-to-one room open until `endDate`. Cloud recording is offered to the
// host (the dentist), who starts it once the patient is in the room.
export async function createMeeting(endDate: Date): Promise<CreatedMeeting> {
  const m = await call<{ meetingId: string; roomName: string; roomUrl: string; hostRoomUrl: string }>('/meetings', {
    method: 'POST',
    body: JSON.stringify({
      endDate: endDate.toISOString(),
      roomMode: 'normal',
      roomNamePrefix: 'tandsmart',
      fields: ['hostRoomUrl'],
      recording: { type: 'cloud', destination: { provider: 'whereby', fileFormat: 'mp4' }, startTrigger: 'prompt' },
    }),
  })
  return { meetingId: m.meetingId, roomName: m.roomName, roomUrl: m.roomUrl, hostRoomUrl: m.hostRoomUrl }
}

export async function deleteMeeting(meetingId: string) {
  await call<void>(`/meetings/${encodeURIComponent(meetingId)}`, { method: 'DELETE' })
}

export interface WherebyRecording { recordingId: string; roomName: string; startDate?: string; endDate?: string }

// Recordings for one room. The list endpoint is paged; tandsmart rooms are
// one-off, so a handful of pages always covers them. Tolerant of the exact
// response shape, and logs it when nothing matches so a mismatch is visible.
export async function listRecordings(roomName: string): Promise<WherebyRecording[]> {
  const norm = (n: unknown) => String(n ?? '').replace(/^\//, '').toLowerCase()
  const target = norm(roomName)
  const found: WherebyRecording[] = []
  let seen = 0
  let cursor: string | undefined
  for (let page = 0; page < 10; page++) {
    const qs = new URLSearchParams({ limit: '100', ...(cursor ? { cursor } : {}) })
    const res = await call<Record<string, unknown>>(`/recordings?${qs}`)
    const items = (Array.isArray(res) ? res : (res.results ?? res.data ?? res.recordings ?? [])) as Record<string, unknown>[]
    seen += items.length
    for (const r of items) {
      const name = norm(r.roomName ?? r.room_name ?? r.roomUrl)
      if (name === target || name.endsWith(`/${target}`)) {
        found.push({
          recordingId: String(r.recordingId ?? r.id),
          roomName: String(r.roomName ?? ''),
          startDate: (r.startDate ?? r.startedAt) as string | undefined,
          endDate: (r.endDate ?? r.endedAt) as string | undefined,
        })
      }
    }
    cursor = (res as { cursor?: string }).cursor
    if (!cursor || items.length === 0) break
  }
  if (!found.length) console.warn('whereby: no recording for', target, `(${seen} recordings listed)`)
  return found
}

// Short-lived link to stream or download one recording.
export async function recordingAccessLink(recordingId: string, validForSeconds = 600): Promise<string> {
  const res = await call<{ accessLink: string }>(
    `/recordings/${encodeURIComponent(recordingId)}/access-link?validForSeconds=${validForSeconds}`,
  )
  return res.accessLink
}
