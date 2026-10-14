import { describe, expect, it } from 'vitest'
import { isGridSlot, slotTimes, stockholmParts, stockholmToUtc, weekDays, weekStart } from './introCalls'

describe('introCalls time helpers', () => {
  it('builds a 08:00–16:45 grid in 15-minute steps', () => {
    const t = slotTimes()
    expect(t[0]).toBe('08:00')
    expect(t[t.length - 1]).toBe('16:45')
    expect(t).toHaveLength(36)
  })

  it('converts Swedish local time to UTC across summer and winter time', () => {
    expect(stockholmToUtc('2026-07-01', '08:00').toISOString()).toBe('2026-07-01T06:00:00.000Z')
    expect(stockholmToUtc('2026-12-01', '08:00').toISOString()).toBe('2026-12-01T07:00:00.000Z')
    expect(stockholmParts(new Date('2026-12-01T07:00:00Z'))).toMatchObject({ day: '2026-12-01', time: '08:00', weekday: 2 })
  })

  it('finds the Monday of the week and its weekdays', () => {
    const now = new Date('2026-10-14T10:00:00Z') // Wednesday
    expect(weekStart(0, now)).toBe('2026-10-12')
    expect(weekStart(1, now)).toBe('2026-10-19')
    expect(weekDays('2026-10-12')).toEqual(['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'])
  })

  it('accepts only weekday slots inside opening hours', () => {
    expect(isGridSlot(stockholmToUtc('2026-10-14', '08:15'))).toBe(true)
    expect(isGridSlot(stockholmToUtc('2026-10-14', '17:00'))).toBe(false)
    expect(isGridSlot(stockholmToUtc('2026-10-14', '08:10'))).toBe(false)
    expect(isGridSlot(stockholmToUtc('2026-10-17', '10:00'))).toBe(false) // Saturday
  })
})
