import { buildInviteUrl } from '../features/invite/inviteLink'
import { DISPLAY_TZ, JOIN_WINDOW_MIN, MAX_INVITEES, MAX_TITLE_LENGTH } from './constants'
import type { Meeting, Occurrence, OccurrenceState, Recurrence } from './types'

const MIN = 60_000
const DAY = 24 * 60 * MIN
const MAX_STEPS = 800

/* ---------- time zones ---------- */

const zoneFormats = new Map<string, Intl.DateTimeFormat>()

function zoneFormat(tz: string): Intl.DateTimeFormat {
  let f = zoneFormats.get(tz)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    zoneFormats.set(tz, f)
  }
  return f
}

function zoneParts(ms: number, tz: string) {
  const get: Record<string, number> = {}
  for (const p of zoneFormat(tz).formatToParts(new Date(ms))) if (p.type !== 'literal') get[p.type] = Number(p.value)
  return { y: get.year, mo: get.month, d: get.day, h: get.hour, mi: get.minute, s: get.second }
}

function offsetMs(ms: number, tz: string): number {
  const whole = Math.floor(ms / 1000) * 1000
  const p = zoneParts(whole, tz)
  return Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - whole
}

/** Wall-clock date ("2026-10-15") and time ("11:00") in a zone to the instant they name. */
export function zonedToUtc(date: string, time: string, tz: string): Date {
  const [y, mo, d] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  const guess = Date.UTC(y, mo - 1, d, h, mi)
  const first = offsetMs(guess, tz)
  let utc = guess - first
  const second = offsetMs(utc, tz)
  if (second !== first) utc = guess - second
  return new Date(utc)
}

const pad = (n: number) => String(n).padStart(2, '0')

/** The instant as wall-clock fields in a zone, for prefilling the form. */
export function utcToZoned(date: Date, tz: string): { date: string; time: string } {
  const p = zoneParts(date.getTime(), tz)
  return { date: `${p.y}-${pad(p.mo)}-${pad(p.d)}`, time: `${pad(p.h)}:${pad(p.mi)}` }
}

export const dayKey = (date: Date, tz: string = DISPLAY_TZ): string => utcToZoned(date, tz).date

export function startOfDay(date: Date, tz: string = DISPLAY_TZ): Date {
  return zonedToUtc(dayKey(date, tz), '00:00', tz)
}

/* ---------- validation ---------- */

export interface ScheduleInput {
  readonly title: string
  readonly date: string
  readonly time: string
  readonly durationMin: number
  readonly timezone: string
  readonly invitees: readonly string[]
  readonly passcodeOn: boolean
  readonly passcode: string
}

export type ScheduleErrors = { -readonly [K in 'title' | 'when' | 'duration' | 'invitees' | 'passcode']?: string }

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/
export const isEmail = (value: string): boolean => EMAIL_RE.test(value)

/** Splits pasted text on commas, semicolons and whitespace; drops duplicates ignoring case. */
export function parseInvitees(raw: string): { valid: string[]; invalid: string[] } {
  const seen = new Set<string>()
  const valid: string[] = []
  const invalid: string[] = []
  for (const token of raw.split(/[\s,;]+/).filter(Boolean)) {
    const key = token.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    if (isEmail(token)) valid.push(token)
    else invalid.push(token)
  }
  return { valid, invalid }
}

export function validateSchedule(input: ScheduleInput, now: Date): ScheduleErrors {
  const errors: ScheduleErrors = {}
  const title = input.title.replace(/\s+/g, ' ').trim()
  if (!title) errors.title = 'Isi judul rapat dulu.'
  else if (title.length > MAX_TITLE_LENGTH) errors.title = `Judul maksimal ${MAX_TITLE_LENGTH} karakter.`

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^\d{2}:\d{2}$/.test(input.time)) {
    errors.when = 'Pilih tanggal dan jam mulai.'
  } else if (zonedToUtc(input.date, input.time, input.timezone).getTime() < now.getTime() - MIN) {
    errors.when = 'Waktu mulai sudah lewat. Pilih waktu yang akan datang.'
  }

  if (!Number.isFinite(input.durationMin) || input.durationMin < 5 || input.durationMin > 480) errors.duration = 'Durasi antara 5 menit dan 8 jam.'
  if (input.invitees.length > MAX_INVITEES) errors.invitees = `Maksimal ${MAX_INVITEES} undangan.`
  if (input.passcodeOn && !/^\d{4,8}$/.test(input.passcode)) errors.passcode = 'Kode sandi 4 sampai 8 angka.'
  return errors
}

/* ---------- occurrences ---------- */

function nth(meeting: Meeting, k: number): Date {
  const base = new Date(meeting.startsAt)
  switch (meeting.recurrence) {
    case 'none':
      return base
    case 'daily':
      return new Date(base.getTime() + k * DAY)
    case 'weekly':
      return new Date(base.getTime() + k * 7 * DAY)
    case 'monthly': {
      const target = new Date(base)
      target.setUTCDate(1)
      target.setUTCMonth(target.getUTCMonth() + k)
      const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
      target.setUTCDate(Math.min(base.getUTCDate(), last))
      return target
    }
  }
}

const STEP: Record<Recurrence, number> = { none: 0, daily: DAY, weekly: 7 * DAY, monthly: 0 }

/** Sessions that overlap [from, to). Cancelled meetings and skipped sessions produce nothing. */
export function occurrencesBetween(meeting: Meeting, from: Date, to: Date): Occurrence[] {
  if (meeting.cancelled) return []
  const duration = meeting.durationMin * MIN
  const step = STEP[meeting.recurrence]
  const base = new Date(meeting.startsAt).getTime()
  const out: Occurrence[] = []
  let k = step > 0 ? Math.max(0, Math.floor((from.getTime() - duration - base) / step)) : 0
  for (let i = 0; i < MAX_STEPS; i++, k++) {
    const start = nth(meeting, k)
    if (start.getTime() >= to.getTime()) break
    const end = new Date(start.getTime() + duration)
    if (end.getTime() > from.getTime() && !meeting.skipped.includes(start.toISOString())) {
      out.push({ key: `${meeting.id}@${start.toISOString()}`, meeting, start, end })
    }
    if (meeting.recurrence === 'none') break
  }
  return out
}

export function allOccurrences(meetings: readonly Meeting[], from: Date, to: Date): Occurrence[] {
  return meetings.flatMap((m) => occurrencesBetween(m, from, to)).sort((a, b) => a.start.getTime() - b.start.getTime())
}

export function occurrenceState(o: Pick<Occurrence, 'start' | 'end'>, now: Date): OccurrenceState {
  const t = now.getTime()
  if (t >= o.end.getTime()) return 'ended'
  if (t >= o.start.getTime()) return 'live'
  if (o.start.getTime() - t <= JOIN_WINDOW_MIN * MIN) return 'joinable'
  return 'upcoming'
}

/** The soonest session that has not ended. */
export function pickNext(occurrences: readonly Occurrence[], now: Date): Occurrence | null {
  return occurrences.find((o) => occurrenceState(o, now) !== 'ended') ?? null
}

/* ---------- labels ---------- */

const timeFormat = new Intl.DateTimeFormat('en-GB', { timeZone: DISPLAY_TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const longDay = new Intl.DateTimeFormat('id-ID', { timeZone: DISPLAY_TZ, weekday: 'long', day: 'numeric', month: 'long' })
const fullDate = new Intl.DateTimeFormat('id-ID', { timeZone: DISPLAY_TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const formatClock = (date: Date): string => timeFormat.format(date)
export const formatLongDay = (date: Date): string => longDay.format(date)
export const formatTimeRange = (o: Pick<Occurrence, 'start' | 'end'>): string => `${formatClock(o.start)}–${formatClock(o.end)}`

export function dayLabel(date: Date, now: Date): string {
  const diff = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY)
  if (diff === 0) return 'Hari ini'
  if (diff === 1) return 'Besok'
  if (diff === -1) return 'Kemarin'
  return longDay.format(date)
}

export interface DayGroup {
  readonly key: string
  readonly label: string
  readonly occurrences: readonly Occurrence[]
}

/** Consecutive sessions on the same day share a group. Input order is kept. */
export function groupByDay(occurrences: readonly Occurrence[], now: Date): DayGroup[] {
  const groups: { key: string; label: string; occurrences: Occurrence[] }[] = []
  for (const o of occurrences) {
    const key = dayKey(o.start)
    const last = groups[groups.length - 1]
    if (last?.key === key) last.occurrences.push(o)
    else groups.push({ key, label: dayLabel(o.start, now), occurrences: [o] })
  }
  return groups
}

const MORNING_END = 11
const NOON_END = 15
const EVENING_START = 18

export function greetingFor(date: Date): string {
  const hour = Number(utcToZoned(date, DISPLAY_TZ).time.slice(0, 2))
  if (hour < 4) return 'Selamat malam'
  if (hour < MORNING_END) return 'Selamat pagi'
  if (hour < NOON_END) return 'Selamat siang'
  if (hour < EVENING_START) return 'Selamat sore'
  return 'Selamat malam'
}

export function countdownLabel(o: Occurrence, now: Date): string {
  const state = occurrenceState(o, now)
  if (state === 'ended') return 'Selesai'
  if (state === 'live') return 'Sedang berlangsung'
  const mins = Math.max(1, Math.ceil((o.start.getTime() - now.getTime()) / MIN))
  if (mins < 60) return `Mulai ${mins} menit lagi`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Mulai ${hours} jam lagi`
  return `${dayLabel(o.start, now)}, ${formatClock(o.start)}`
}

const RECURRENCE_LABEL: Record<Recurrence, string> = { none: 'Sekali', daily: 'Setiap hari', weekly: 'Setiap minggu', monthly: 'Setiap bulan' }
export const recurrenceLabel = (r: Recurrence): string => RECURRENCE_LABEL[r]

/* ---------- invitation ---------- */

/** Plain text the host pastes into any chat or email. */
export function buildInvitationText(meeting: Meeting, start: Date): string {
  const end = new Date(start.getTime() + meeting.durationMin * MIN)
  const lines = [
    `${meeting.hostName} mengundang Anda ke rapat Huddle.`,
    '',
    `Topik: ${meeting.title}`,
    `Waktu: ${fullDate.format(start)}, ${formatTimeRange({ start, end })} WIB`,
  ]
  if (meeting.recurrence !== 'none') lines.push(`Berulang: ${RECURRENCE_LABEL[meeting.recurrence].toLowerCase()}`)
  if (meeting.description.trim()) lines.push(`Catatan: ${meeting.description.trim()}`)
  lines.push('', `Gabung: ${buildInviteUrl(meeting.code)}`, `Kode rapat: ${meeting.code}`)
  if (meeting.security.passcode) lines.push(`Kode sandi: ${meeting.security.passcode}`)
  return lines.join('\n')
}
