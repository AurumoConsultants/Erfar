// Free 5-minute "startsamtal": a short video call with Doktor Sylvia to help
// a patient get going with a case. Sylvia opens bookable times on a weekly
// grid (Mon–Fri 08:00–17:00, Swedish time); patients book one at a time.

export const CALL_MINUTES = 5
export const SLOT_MINUTES = 15 // grid step: the call plus a buffer
export const DAY_START = 8
export const DAY_END = 17
export const WEEKS_AHEAD = 4
export const BOOKING_LEAD_MINUTES = 30 // a slot must start at least this far ahead
export const JOIN_EARLY_MINUTES = 10
export const JOIN_LATE_MINUTES = 30

const TZ = 'Europe/Stockholm'
export const WEEKDAY_LABELS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag']

// Start times of the grid's slots, e.g. ['08:00', '08:15', … '16:45'].
export function slotTimes(): string[] {
  const out: string[] = []
  for (let m = DAY_START * 60; m + SLOT_MINUTES <= DAY_END * 60; m += SLOT_MINUTES) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
  }
  return out
}

const fmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, hourCycle: 'h23', weekday: 'short',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
})
const WEEKDAYS: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }

// A UTC instant as Swedish local date ('YYYY-MM-DD'), time ('HH:MM') and ISO weekday (1 = Monday).
export function stockholmParts(date: Date) {
  const p = Object.fromEntries(fmt.formatToParts(date).map(x => [x.type, x.value]))
  return { day: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}`, weekday: WEEKDAYS[p.weekday], second: Number(p.second) }
}

function offsetMinutes(date: Date) {
  const p = stockholmParts(date)
  const [y, m, d] = p.day.split('-').map(Number)
  const [h, mi] = p.time.split(':').map(Number)
  return (Date.UTC(y, m - 1, d, h, mi, p.second) - date.getTime()) / 60_000
}

// Swedish local date + time → UTC instant (handles summer/winter time).
export function stockholmToUtc(day: string, time: string): Date {
  const [y, m, d] = day.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  const naive = Date.UTC(y, m - 1, d, h, mi)
  let t = naive - offsetMinutes(new Date(naive)) * 60_000
  const second = naive - offsetMinutes(new Date(t)) * 60_000
  if (second !== t) t = second
  return new Date(t)
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

// Monday of the Swedish week `offset` weeks from the week containing `now`.
export function weekStart(offset = 0, now = new Date()): string {
  const { day, weekday } = stockholmParts(now)
  return addDays(day, 1 - weekday + 7 * offset)
}

// The five weekdays of a week starting on `monday`.
export function weekDays(monday: string): string[] {
  return [0, 1, 2, 3, 4].map(i => addDays(monday, i))
}

// Is this instant a valid grid slot (weekday, within opening hours, on the step)?
export function isGridSlot(date: Date): boolean {
  const { weekday, time } = stockholmParts(date)
  return weekday <= 5 && slotTimes().includes(time) && date.getUTCSeconds() === 0 && date.getUTCMilliseconds() === 0
}

export function canJoin(startsAt: Date, now = new Date()) {
  const t = now.getTime()
  return t >= startsAt.getTime() - JOIN_EARLY_MINUTES * 60_000 && t <= startsAt.getTime() + JOIN_LATE_MINUTES * 60_000
}

export function formatSlot(iso: string) {
  return new Date(iso).toLocaleString('sv-SE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

export function formatDayLabel(day: string) {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString('sv-SE', { timeZone: TZ, day: 'numeric', month: 'short' })
}
