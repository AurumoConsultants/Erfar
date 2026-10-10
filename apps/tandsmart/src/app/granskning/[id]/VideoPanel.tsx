'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import CardTitle from '@/components/ui/CardTitle'
import Field, { fieldInputClassName } from '@/components/ui/Field'
import VideoMeetingList from '@/components/video/VideoMeetingList'
import type { VideoMeeting } from '@/lib/video'

// Dentist: book video consultations on the case, run them, fetch recordings.
export default function VideoPanel({ caseId, meetings, requested, configured }: {
  caseId: string; meetings: VideoMeeting[]; requested: boolean; configured: boolean
}) {
  const router = useRouter()
  const [when, setWhen] = useState('')
  const [duration, setDuration] = useState('20')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  async function post(url: string, body?: object) {
    setBusy(true)
    setNotice(null)
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setNotice(json.error ?? 'Något gick fel.'); return null }
    router.refresh()
    return json
  }

  async function book(e: React.FormEvent) {
    e.preventDefault()
    const json = await post(`/api/granskning/${caseId}/video`, { scheduledAt: new Date(when).toISOString(), durationMinutes: Number(duration) })
    if (json) {
      setWhen('')
      setNotice(json.emailed ? 'Bokat. Patienten har fått ett mejl.' : 'Bokat. Mejlet kunde inte skickas — meddela patienten i ärendet.')
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <CardTitle icon="chat">Videosamtal</CardTitle>
        {requested && <span className="text-xs font-bold rounded-full bg-accent-600 text-white px-2.5 py-0.5">Patienten har beställt videosamtal</span>}
      </div>

      <VideoMeetingList meetings={meetings} canPlay actions={m => (
        <>
          {m.status === 'bokad' && <>
            <Button variant="secondary" disabled={busy} onClick={() => post(`/api/video/${m.id}/status`, { status: 'genomford' })}>Markera genomfört</Button>
            <Button variant="secondary" disabled={busy} onClick={() => confirm('Avboka samtalet?') && post(`/api/video/${m.id}/status`, { status: 'avbokad' })}>Avboka</Button>
          </>}
          {m.status === 'genomford' && (
            <Button variant="secondary" disabled={busy} onClick={async () => {
              const json = await post(`/api/video/${m.id}/inspelningar`)
              if (json) setNotice(json.recordings ? `${json.recordings} inspelning(ar) hittades.` : 'Ingen inspelning ännu — Whereby kan behöva några minuter.')
            }}>Hämta inspelning</Button>
          )}
        </>
      )} />

      {configured ? (
        <form onSubmit={book} className="grid grid-cols-1 sm:grid-cols-[1fr_8rem_auto] gap-3 items-end">
          <Field label="Boka nytt samtal" htmlFor="v-when">
            <input id="v-when" type="datetime-local" required value={when} onChange={e => setWhen(e.target.value)} className={fieldInputClassName()} />
          </Field>
          <Field label="Längd (min)" htmlFor="v-dur">
            <input id="v-dur" type="number" min={5} max={120} step={5} value={duration} onChange={e => setDuration(e.target.value)} className={fieldInputClassName()} />
          </Field>
          <Button type="submit" disabled={busy || !when}>Boka</Button>
        </form>
      ) : (
        <p className="text-sm text-gray-500">Videotjänsten är inte aktiverad än (WHEREBY_API_KEY saknas).</p>
      )}
      {notice && <p className="text-sm text-gray-700">{notice}</p>}
    </Card>
  )
}
