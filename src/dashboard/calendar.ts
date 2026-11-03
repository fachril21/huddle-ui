import { TIMEZONES } from './constants'
import { allOccurrences, dayKey, utcToZoned, zonedToUtc } from './schedule'
import type { Meeting } from './types'

/** "2026-10-15": a calendar day with no zone attached. All arithmetic here is on UTC midnights, so it ignores DST. */
export type DayKey = string
/** "2026-10" */
export type MonthKey = string

const MIN = 60_000
const DAY = 24 * 60 * MIN
const GRID_WEEKS = 6
const SLOT_STEP_MIN = 30
const FIRST_SLOT_HOUR = 6
const LAST_SLOT_HOUR = 22
const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/

const pad = (n: number) => String(n).padStart(2, '0')
const toMs = (key: DayKey): number => {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
const fromMs = (ms: number): DayKey => new Date(ms).toISOString().slice(0, 10)

export const isDayKey = (value: string): boolean => DAY_KEY_RE.test(value)
export const addDays = (key: DayKey, n: number): DayKey => fromMs(toMs(key) + n * DAY)
export const monthOf = (key: DayKey): MonthKey => key.slice(0, 7)

export function addMonths(month: MonthKey, n: number): MonthKey {
  const [y, m] = month.split('-').map(Number)
  const index = y * 12 + (m - 1) + n
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`
}

const daysInMonth = (month: MonthKey): number => Number(addDays(`${addMonths(month, 1)}-01`, -1).slice(8))

/** Same day-of-month in another month, clamped (31 Jan + 1 month = 28 Feb). */
export function shiftMonth(key: DayKey, n: number): DayKey {
  const month = addMonths(monthOf(key), n)
  return `${month}-${pad(Math.min(Number(key.slice(8)), daysInMonth(month)))}`
}

/** 0 = Monday ... 6 = Sunday */
export const weekdayIndex = (key: DayKey): number => (new Date(toMs(key)).getUTCDay() + 6) % 7

/** Always six Monday-first weeks so the calendar keeps its height from month to month. Days outside the month are null. */
export function monthGrid(month: MonthKey): (DayKey | null)[][] {
  const first = `${month}-01`
  const start = addDays(first, -weekdayIndex(first))
  return Array.from({ length: GRID_WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const key = addDays(start, w * 7 + d)
      return monthOf(key) === month ? key : null
    }),
  )
}

/** The Monday after `today`; a Monday asks for the next one. */
export const nextMonday = (today: DayKey): DayKey => addDays(today, 7 - weekdayIndex(today))

/** Start times of the pickable slots, 06:00 to 22:30. Anything else goes through the free time field. */
export function slotTimes(): string[] {
  const out: string[] = []
  for (let h = FIRST_SLOT_HOUR; h <= LAST_SLOT_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_STEP_MIN) out.push(`${pad(h)}:${pad(m)}`)
  }
  return out
}

/* ---------- conflicts ---------- */

export interface Busy {
  readonly title: string
  readonly start: number
  readonly end: number
}

/** Sessions of other meetings that touch the day, in the zone the day is read in. */
export function busyOnDay(meetings: readonly Meeting[], date: DayKey, tz: string, excludeId?: string): Busy[] {
  const from = zonedToUtc(date, '00:00', tz)
  const to = zonedToUtc(addDays(date, 1), '00:00', tz)
  return allOccurrences(
    meetings.filter((m) => m.id !== excludeId),
    from,
    to,
  ).map((o) => ({ title: o.meeting.title, start: o.start.getTime(), end: o.end.getTime() }))
}

/** The first session that overlaps [startMs, startMs + duration), if any. */
export function conflictAt(busy: readonly Busy[], startMs: number, durationMin: number): Busy | undefined {
  const end = startMs + durationMin * MIN
  return busy.find((b) => b.start < end && b.end > startMs)
}

/** Days of the month grid that already have a meeting, for the dots on the calendar. */
export function daysWithMeetings(meetings: readonly Meeting[], month: MonthKey, tz: string, excludeId?: string): Set<DayKey> {
  const days = monthGrid(month)
    .flat()
    .filter((d): d is DayKey => d !== null)
  const from = zonedToUtc(days[0], '00:00', tz)
  const to = zonedToUtc(addDays(days[days.length - 1], 1), '00:00', tz)
  const set = new Set<DayKey>()
  for (const o of allOccurrences(
    meetings.filter((m) => m.id !== excludeId),
    from,
    to,
  )) {
    set.add(dayKey(o.start, tz))
  }
  return set
}

/* ---------- labels ---------- */

const dayFormat = new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' })
const monthFormat = new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', month: 'long', year: 'numeric' })

export const formatDay = (key: DayKey): string => dayFormat.format(new Date(toMs(key)))
export const formatMonth = (month: MonthKey): string => monthFormat.format(new Date(toMs(`${month}-01`)))
export const zoneShortName = (tz: string): string => TIMEZONES.find((z) => z.id === tz)?.label.split(' ')[0] ?? tz

/** "10:00–11:00", with the end read in the same zone as the start. */
export function formatRange(date: DayKey, time: string, durationMin: number, tz: string): string {
  const end = utcToZoned(new Date(zonedToUtc(date, time, tz).getTime() + durationMin * MIN), tz).time
  return `${time}–${end}`
}
