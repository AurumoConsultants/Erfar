'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { formatSlot } from '@/lib/introCalls'

interface Day { day: string; label: string; slots: { id: string; startsAt: string; time: string }[] }

// Week view of open times; pick one and confirm.
export function BookSlots({ days }: { days: Day[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<{ id: string; startsAt: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function book() {
    if (!selected) return
    setBusy(true)
    setError(null)
    const res = await fetch('/api/startsamtal/boka', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slotId: selected.id }),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setSelected(null)
      router.refresh()
      return setError(json.error ?? 'Kunde inte boka tiden.')
    }
    router.refresh()
  }

  const empty = days.every(d => d.slots.length === 0)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {days.map(d => (
          <div key={d.day} className="rounded-xl border border-gray-200 p-2">
            <p className="text-sm font-brand font-semibold text-brand-navy px-1 pb-2">{d.label}</p>
            <div className="flex flex-wrap sm:flex-col gap-1.5">
              {d.slots.length === 0 && <p className="text-xs text-gray-400 px-1">Inga lediga tider</p>}
              {d.slots.map(s => (
                <button key={s.id} type="button" onClick={() => setSelected(s)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${selected?.id === s.id
                    ? 'bg-accent-600 text-white' : 'bg-accent-50 text-accent-800 hover:bg-accent-100'}`}>
                  {s.time}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {empty && <p className="text-sm text-gray-500">Inga lediga tider den här veckan. Titta på nästa vecka.</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {selected && (
        <div className="rounded-xl bg-accent-50 border border-accent-200 p-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm">Boka startsamtal <strong className="first-letter:uppercase">{formatSlot(selected.startsAt)}</strong>?</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setSelected(null)} disabled={busy}>Avbryt</Button>
            <Button onClick={book} disabled={busy}>{busy ? 'Bokar…' : 'Boka tiden'}</Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function CancelBooking({ id, label = 'Avboka' }: { id: string; label?: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function cancel() {
    if (!confirm('Avboka startsamtalet? Tiden blir ledig för någon annan.')) return
    setBusy(true)
    const res = await fetch(`/api/startsamtal/${id}/avboka`, { method: 'POST' })
    setBusy(false)
    if (res.ok) router.refresh()
    else alert((await res.json().catch(() => ({}))).error ?? 'Kunde inte avboka.')
  }
  return <Button variant="secondary" onClick={cancel} disabled={busy}>{busy ? 'Avbokar…' : label}</Button>
}
