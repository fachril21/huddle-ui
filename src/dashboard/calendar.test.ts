import { describe, expect, it } from 'vitest'
import { addDays, addMonths, busyOnDay, conflictAt, daysWithMeetings, formatRange, monthGrid, nextMonday, shiftMonth, slotTimes, weekdayIndex } from './calendar'
import type { Meeting } from './types'

const meeting = (over: Partial<Meeting> = {}): Meeting => ({
  id: 'm1',
  code: 'abc-defg-hij',
  title: 'Sprint planning',
  description: '',
  startsAt: '2026-10-15T03:00:00.000Z', // Thu 10:00 WIB
  durationMin: 60,
  timezone: 'Asia/Jakarta',
  recurrence: 'none',
  invitees: [],
  hostName: 'Fachril',
  isHost: true,
  security: { passcode: null, waitingRoom: false, muteOnJoin: false },
  cancelled: false,
  skipped: [],
  ...over,
})

describe('day arithmetic', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
  })

  it('clamps the day when the target month is shorter', () => {
    expect(shiftMonth('2026-01-31', 1)).toBe('2026-02-28')
    expect(shiftMonth('2026-03-31', -1)).toBe('2026-02-28')
  })

  it('counts Monday as the first day of the week', () => {
    expect(weekdayIndex('2026-10-12')).toBe(0)
    expect(weekdayIndex('2026-10-18')).toBe(6)
  })

  it('skips to the following Monday, even from a Monday', () => {
    expect(nextMonday('2026-10-15')).toBe('2026-10-19')
    expect(nextMonday('2026-10-19')).toBe('2026-10-26')
    expect(nextMonday('2026-10-18')).toBe('2026-10-19')
  })
})

describe('monthGrid', () => {
  it('has six weeks of seven, with every day of the month exactly once', () => {
    const grid = monthGrid('2026-10')
    expect(grid).toHaveLength(6)
    expect(grid.every((w) => w.length === 7)).toBe(true)
    const days = grid.flat().filter(Boolean)
    expect(days).toHaveLength(31)
    expect(days[0]).toBe('2026-10-01')
  })

  it('puts the 1st under the right weekday', () => {
    // 1 Oct 2026 is a Thursday
    expect(monthGrid('2026-10')[0].indexOf('2026-10-01')).toBe(3)
  })
})

describe('slotTimes', () => {
  it('runs from 06:00 to 22:30 in half hours', () => {
    const slots = slotTimes()
    expect(slots[0]).toBe('06:00')
    expect(slots[1]).toBe('06:30')
    expect(slots[slots.length - 1]).toBe('22:30')
  })
})

describe('conflicts', () => {
  const meetings = [meeting()]

  it('lists sessions on the day in the zone it is read in', () => {
    expect(busyOnDay(meetings, '2026-10-15', 'Asia/Jakarta')).toHaveLength(1)
    expect(busyOnDay(meetings, '2026-10-14', 'Asia/Jakarta')).toHaveLength(0)
  })

  it('leaves out the meeting being edited and cancelled ones', () => {
    expect(busyOnDay(meetings, '2026-10-15', 'Asia/Jakarta', 'm1')).toHaveLength(0)
    expect(busyOnDay([meeting({ cancelled: true })], '2026-10-15', 'Asia/Jakarta')).toHaveLength(0)
  })

  it('flags an overlap but not back to back sessions', () => {
    const busy = busyOnDay(meetings, '2026-10-15', 'Asia/Jakarta')
    const at = (hhmm: string) => new Date(`2026-10-15T${hhmm}:00+07:00`).getTime()
    expect(conflictAt(busy, at('10:30'), 30)?.title).toBe('Sprint planning')
    expect(conflictAt(busy, at('09:30'), 60)?.title).toBe('Sprint planning')
    expect(conflictAt(busy, at('09:00'), 60)).toBeUndefined()
    expect(conflictAt(busy, at('11:00'), 30)).toBeUndefined()
  })

  it('marks the days that have a meeting, including repeats', () => {
    const weekly = meeting({ recurrence: 'weekly' })
    const days = daysWithMeetings([weekly], '2026-10', 'Asia/Jakarta')
    expect(days.has('2026-10-15')).toBe(true)
    expect(days.has('2026-10-22')).toBe(true)
    expect(days.has('2026-10-16')).toBe(false)
  })
})

describe('formatRange', () => {
  it('adds the duration to the start', () => {
    expect(formatRange('2026-10-15', '10:00', 90, 'Asia/Jakarta')).toBe('10:00–11:30')
  })

  it('wraps past midnight', () => {
    expect(formatRange('2026-10-15', '23:30', 60, 'Asia/Jakarta')).toBe('23:30–00:30')
  })
})
