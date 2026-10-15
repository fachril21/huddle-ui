import { isMeetingCode } from './meetingCode'
import type { Meeting, Recurrence } from './types'

const STORAGE_KEY = 'huddle.meetings.v1'
/** Sample meetings are rebuilt around "now" on every load, so only meetings the user made are remembered. */
export const SEED_PREFIX = 'seed-'

const RECURRENCES: readonly Recurrence[] = ['none', 'daily', 'weekly', 'monthly']

function isMeeting(value: unknown): value is Meeting {
  if (typeof value !== 'object' || value === null) return false
  const m = value as Record<string, unknown>
  const sec = m.security as Record<string, unknown> | null | undefined
  return (
    typeof m.id === 'string' &&
    typeof m.code === 'string' &&
    isMeetingCode(m.code) &&
    typeof m.title === 'string' &&
    typeof m.description === 'string' &&
    typeof m.startsAt === 'string' &&
    !Number.isNaN(Date.parse(m.startsAt)) &&
    typeof m.durationMin === 'number' &&
    typeof m.timezone === 'string' &&
    RECURRENCES.includes(m.recurrence as Recurrence) &&
    Array.isArray(m.invitees) &&
    m.invitees.every((i) => typeof i === 'string') &&
    typeof m.hostName === 'string' &&
    typeof m.isHost === 'boolean' &&
    typeof sec === 'object' &&
    sec !== null &&
    (sec.passcode === null || typeof sec.passcode === 'string') &&
    typeof sec.waitingRoom === 'boolean' &&
    typeof sec.muteOnJoin === 'boolean' &&
    typeof m.cancelled === 'boolean' &&
    Array.isArray(m.skipped) &&
    m.skipped.every((s) => typeof s === 'string')
  )
}

/** Stored JSON back to meetings. Anything malformed is dropped rather than trusted. */
export function parseStored(json: string | null): Meeting[] {
  if (!json) return []
  try {
    const data: unknown = JSON.parse(json)
    return Array.isArray(data) ? data.filter(isMeeting) : []
  } catch {
    return []
  }
}

export function loadCustomMeetings(): Meeting[] {
  try {
    return parseStored(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return []
  }
}

export function saveCustomMeetings(meetings: readonly Meeting[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings.filter((m) => !m.id.startsWith(SEED_PREFIX))))
  } catch {
    // Storage full or blocked: the session keeps working, the meetings just aren't remembered
  }
}
