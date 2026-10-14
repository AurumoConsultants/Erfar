'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { fieldInputClassName } from '@/components/ui/Field'
import type { CaseStatus } from '@/lib/cases'

interface Props {
  caseId: string
  status: CaseStatus
  request: string | null
  requestedAt: string | null
  answeredAt: string | null
}

const SUGGESTIONS = [
  'Röntgenbilder från senaste undersökningen',
  'Journalkopia med klinikens anteckningar och diagnos',
  'Foto av tänderna det gäller',
  'Det fullständiga kostnadsförslaget med åtgärdskoder',
]

const fmt = (iso: string) => new Date(iso).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })

export default function RequestComplement({ caseId, status, request, requestedAt, answeredAt }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const closed = status === 'besvarat' || status === 'avslutat'
  const waiting = status === 'komplettering'
  const answered = !waiting && answeredAt && requestedAt && answeredAt >= requestedAt

  async function send() {
    setBusy(true)
    setError(null)
    const res = await fetch(`/api/granskning/${caseId}/komplettering`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) return setError(json.error ?? 'Kunde inte skicka begäran.')
    setOpen(false)
    setMessage('')
    router.refresh()
  }

  if (closed && !waiting && !answered) return null

  return (
    <Card className={`space-y-3 ${waiting ? 'border-accent-300 bg-accent-50' : answered ? 'border-green-300 bg-green-50' : ''}`}>
      {waiting && request && (
        <div>
          <p className="font-semibold">Väntar på komplettering från patienten</p>
          <p className="text-xs text-gray-500">Begärt {requestedAt && fmt(requestedAt)}</p>
          <p className="text-sm whitespace-pre-wrap mt-2">{request}</p>
        </div>
      )}
      {answered && (
        <div>
          <p className="font-semibold text-green-800">Komplettering inkommen {fmt(answeredAt!)}</p>
          <p className="text-sm text-gray-600">Nya filer finns under Patientens underlag och en eventuell kommentar under Meddelanden.</p>
          {request && <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">Du bad om: {request}</p>}
        </div>
      )}

      {!closed && !open && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {!waiting && !answered && (
            <p className="text-sm text-gray-600">Saknas röntgen, journal eller annat underlag för att kunna bedöma ärendet?</p>
          )}
          <Button variant="secondary" onClick={() => { setOpen(true); setMessage(waiting && request ? request : '') }}>
            {waiting ? 'Ändra begäran' : 'Begär komplettering'}
          </Button>
        </div>
      )}

      {open && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Vad behöver patienten skicka in?</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button key={s} type="button"
                onClick={() => setMessage(prev => (prev.includes(s) ? prev : `${prev ? `${prev}\n` : ''}• ${s}`))}
                className="text-xs px-2.5 py-1 rounded-full border border-gray-300 bg-white hover:border-accent-400">
                + {s}
              </button>
            ))}
          </div>
          <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)} maxLength={5000}
            aria-label="Begäran om komplettering" className={fieldInputClassName('bg-white')} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>Avbryt</Button>
            <Button onClick={send} disabled={busy || !message.trim()}>{busy ? 'Skickar…' : 'Skicka till patienten'}</Button>
          </div>
          <p className="text-xs text-gray-500">Patienten får ett mejl och ärendet markeras som "Väntar på komplettering" tills hen skickat in.</p>
        </div>
      )}
    </Card>
  )
}
