import Link from 'next/link'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import { buttonClassName } from '@/components/ui/Button'
import { requireDentist } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  CALL_MINUTES, WEEKDAY_LABELS, addDays, formatDayLabel, slotTimes, stockholmParts, stockholmToUtc, weekDays, weekStart,
} from '@/lib/introCalls'
import AvailabilityGrid, { type GridCell } from './AvailabilityGrid'

const MAX_WEEKS = 12

// Doktor Sylvia's calendar for free intro calls: open and close bookable
// times, see who has booked and join the calls.
export default async function IntroCallAdminPage({ searchParams }: { searchParams: Promise<{ vecka?: string }> }) {
  await requireDentist()
  const { vecka } = await searchParams
  const offset = Math.min(Math.max(Number(vecka) || 0, 0), MAX_WEEKS)
  const monday = weekStart(offset)

  const admin = createAdminClient()
  const { data: slots } = await admin.from('intro_call_slots')
    .select('id, starts_at, booked_by, patient:profiles!intro_call_slots_booked_by_fkey(full_name)')
    .gte('starts_at', stockholmToUtc(monday, '00:00').toISOString())
    .lt('starts_at', stockholmToUtc(addDays(monday, 7), '00:00').toISOString())
  const byStart = new Map((slots ?? []).map(s => [new Date(s.starts_at).toISOString(), s]))

  const now = Date.now()
  const days = weekDays(monday)
  const times = slotTimes()
  const cells: GridCell[][] = times.map(time => days.map(day => {
    const startsAt = stockholmToUtc(day, time).toISOString()
    const slot = byStart.get(startsAt)
    const patient = slot?.patient as unknown as { full_name: string } | null
    return {
      startsAt,
      past: new Date(startsAt).getTime() <= now,
      state: !slot ? 'closed' : slot.booked_by ? 'booked' : 'open',
      slotId: slot?.id ?? null,
      patientName: patient?.full_name ?? null,
    }
  }))
  const upcoming = (slots ?? []).filter(s => s.booked_by && new Date(s.starts_at).getTime() > now - 30 * 60_000)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))

  return (
    <div className="space-y-6">
      <PageHeader icon="chat" eyebrow="Tandläkarvy" title="Startsamtal">
        Kostnadsfria samtal på {CALL_MINUTES} minuter för patienter som vill ha hjälp att komma igång. Klicka i kalendern för att
        öppna eller stänga tider (kvartar, måndag–fredag 08–17). Patienter ser bara de tider du har öppnat.
      </PageHeader>

      {upcoming.length > 0 && (
        <Card className="space-y-2">
          <h2 className="font-semibold">Bokade samtal den här veckan</h2>
          <ul className="text-sm divide-y divide-gray-100">
            {upcoming.map(s => {
              const p = stockholmParts(new Date(s.starts_at))
              const patient = s.patient as unknown as { full_name: string } | null
              return (
                <li key={s.id} className="py-2 flex items-center justify-between gap-3">
                  <span><strong>{WEEKDAY_LABELS[p.weekday - 1]} {formatDayLabel(p.day)} {p.time}</strong> · {patient?.full_name ?? 'Patient'}</span>
                  <Link href={`/startsamtal/${s.id}`} className="text-accent-700 font-semibold hover:underline">Öppna samtalet →</Link>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-semibold">Vecka från {formatDayLabel(monday)}</h2>
          <div className="flex items-center gap-2 text-sm">
            {offset > 0
              ? <Link href={`/granskning/startsamtal?vecka=${offset - 1}`} className={buttonClassName('secondary', 'px-3!')}>← Föregående</Link>
              : <span className={buttonClassName('secondary', 'px-3! opacity-40')}>← Föregående</span>}
            {offset < MAX_WEEKS
              ? <Link href={`/granskning/startsamtal?vecka=${offset + 1}`} className={buttonClassName('secondary', 'px-3!')}>Nästa →</Link>
              : <span className={buttonClassName('secondary', 'px-3! opacity-40')}>Nästa →</span>}
          </div>
        </div>
        <AvailabilityGrid
          days={days.map((day, i) => ({ day, label: `${WEEKDAY_LABELS[i].slice(0, 3)} ${formatDayLabel(day)}` }))}
          times={times} cells={cells} />
      </Card>
    </div>
  )
}
