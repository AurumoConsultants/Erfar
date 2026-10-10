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
// one-off, so a handful of pages always covers them.
export async function listRecordings(roomName: string): Promise<WherebyRecording[]> {
  const found: WherebyRecording[] = []
  let cursor: string | undefined
  for (let page = 0; page < 10; page++) {
    const qs = new URLSearchParams({ limit: '100', ...(cursor ? { cursor } : {}) })
    const res = await call<{ results: WherebyRecording[]; cursor?: string }>(`/recordings?${qs}`)
    // roomName from the API may or may not carry the leading slash.
    const norm = (n: string) => n.replace(/^\//, '')
    found.push(...res.results.filter(r => norm(r.roomName) === norm(roomName)))
    if (!res.cursor) break
    cursor = res.cursor
  }
  return found
}

// Short-lived link to stream or download one recording.
export async function recordingAccessLink(recordingId: string, validForSeconds = 600): Promise<string> {
  const res = await call<{ accessLink: string }>(
    `/recordings/${encodeURIComponent(recordingId)}/access-link?validForSeconds=${validForSeconds}`,
  )
  return res.accessLink
}
