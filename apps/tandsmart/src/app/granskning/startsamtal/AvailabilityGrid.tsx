'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export interface GridCell {
  startsAt: string
  past: boolean
  state: 'closed' | 'open' | 'booked'
  slotId: string | null
  patientName: string | null
}

// Week grid (rows = quarter hours, columns = weekdays). Click a free cell to
// open or close it; the day headers open or close a whole day at once.
export default function AvailabilityGrid({ days, times, cells }: {
  days: { day: string; label: string }[]; times: string[]; cells: GridCell[][]
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send(action: 'open' | 'close', startsAt: string[]) {
    if (startsAt.length === 0) return
    setBusy(true)
    setError(null)
    const res = await fetch('/api/startsamtal/tider', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, startsAt }),
    })
    setBusy(false)
    if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? 'Kunde inte spara.')
    router.refresh()
  }

  function column(i: number) { return cells.map(row => row[i]).filter(c => !c.past) }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-accent-500" /> Bokningsbar</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-brand-navy" /> Bokad</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-gray-300 bg-white" /> Stängd</span>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className={`overflow-x-auto ${busy ? 'opacity-60 pointer-events-none' : ''}`}>
        <table className="w-full min-w-[640px] border-separate border-spacing-1 text-xs">
          <thead>
            <tr>
              <th className="w-14" />
              {days.map((d, i) => {
                const col = column(i)
                const openable = col.filter(c => c.state === 'closed').map(c => c.startsAt)
                const closable = col.filter(c => c.state === 'open').map(c => c.startsAt)
                return (
                  <th key={d.day} className="font-brand font-semibold text-brand-navy text-sm pb-1">
                    <div>{d.label}</div>
                    <div className="flex justify-center gap-2 font-sans font-normal text-[11px] mt-0.5">
                      <button type="button" disabled={!openable.length} onClick={() => send('open', openable)}
                        className="text-accent-700 hover:underline disabled:text-gray-300 disabled:no-underline">Öppna dagen</button>
                      <button type="button" disabled={!closable.length} onClick={() => send('close', closable)}
                        className="text-gray-500 hover:underline disabled:text-gray-300 disabled:no-underline">Stäng</button>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {times.map((time, r) => (
              <tr key={time}>
                <td className="text-right pr-1 text-gray-500 tabular-nums">{time}</td>
                {cells[r].map(c => {
                  if (c.state === 'booked') {
                    return (
                      <td key={c.startsAt}>
                        <Link href={`/startsamtal/${c.slotId}`} title={`Bokad av ${c.patientName ?? 'patient'}`}
                          className="block h-7 rounded bg-brand-navy text-white px-1.5 leading-7 truncate hover:opacity-90">
                          {c.patientName ?? 'Bokad'}
                        </Link>
                      </td>
                    )
                  }
                  const open = c.state === 'open'
                  return (
                    <td key={c.startsAt}>
                      <button type="button" disabled={c.past} onClick={() => send(open ? 'close' : 'open', [c.startsAt])}
                        aria-label={`${time} ${open ? 'bokningsbar, klicka för att stänga' : 'stängd, klicka för att öppna'}`}
                        className={`block w-full h-7 rounded transition ${c.past
                          ? (open ? 'bg-accent-200' : 'bg-gray-50')
                          : open ? 'bg-accent-500 hover:bg-accent-600' : 'border border-gray-200 bg-white hover:border-accent-400 hover:bg-accent-50'}`} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
