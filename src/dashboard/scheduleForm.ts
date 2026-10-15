import { DISPLAY_TZ, MY_ROOM_CODE, USER_NAME } from './constants'
import { generateMeetingCode, generatePasscode } from './meetingCode'
import { utcToZoned, validateSchedule, zonedToUtc } from './schedule'
import type { ScheduleErrors, ScheduleInput } from './schedule'
import type { Meeting, Occurrence, Recurrence } from './types'

export type FormMode = 'create' | 'edit' | 'duplicate'
export type EditScope = 'single' | 'series'

export interface FormState {
  readonly title: string
  readonly description: string
  readonly date: string
  readonly time: string
  readonly durationMin: number
  readonly timezone: string
  readonly recurrence: Recurrence
  readonly invitees: readonly string[]
  readonly room: 'auto' | 'mine'
  readonly passcodeOn: boolean
  readonly passcode: string
  readonly waitingRoom: boolean
  readonly muteOnJoin: boolean
  readonly scope: EditScope
}

export interface FormSource {
  readonly meeting: Meeting
  readonly occurrence: Occurrence
}

/** What the dashboard should do with a saved form, plus what to show in the invitation afterwards. */
export type ScheduleResult =
  | { kind: 'create'; meeting: Meeting; start: Date }
  | { kind: 'series'; id: string; meeting: Meeting; start: Date }
  | { kind: 'single'; id: string; startIso: string; meeting: Meeting; start: Date }

const MIN = 60_000
const LEAD_MIN = 15
const SLOT_MIN = 30
const DEFAULT_DURATION_MIN = 60

/** The next half hour that is at least a quarter hour away, in the display zone. */
export function defaultStart(now: Date): { date: string; time: string } {
  const slot = SLOT_MIN * MIN
  return utcToZoned(new Date(Math.ceil((now.getTime() + LEAD_MIN * MIN) / slot) * slot), DISPLAY_TZ)
}

export function initialForm(mode: FormMode, now: Date, source?: FormSource): FormState {
  const fresh = defaultStart(now)
  if (!source) {
    return {
      title: '',
      description: '',
      ...fresh,
      durationMin: DEFAULT_DURATION_MIN,
      timezone: DISPLAY_TZ,
      recurrence: 'none',
      invitees: [],
      room: 'auto',
      passcodeOn: false,
      passcode: generatePasscode(),
      waitingRoom: true,
      muteOnJoin: false,
      scope: 'series',
    }
  }
  const { meeting, occurrence } = source
  const own = utcToZoned(occurrence.start, meeting.timezone)
  const copy = mode === 'duplicate'
  return {
    title: meeting.title,
    description: meeting.description,
    date: copy ? fresh.date : own.date,
    time: copy ? fresh.time : own.time,
    durationMin: meeting.durationMin,
    timezone: copy ? DISPLAY_TZ : meeting.timezone,
    recurrence: meeting.recurrence,
    invitees: meeting.invitees,
    room: meeting.code === MY_ROOM_CODE ? 'mine' : 'auto',
    passcodeOn: meeting.security.passcode !== null,
    passcode: meeting.security.passcode ?? generatePasscode(),
    waitingRoom: meeting.security.waitingRoom,
    muteOnJoin: meeting.security.muteOnJoin,
    scope: meeting.recurrence === 'none' ? 'series' : 'single',
  }
}

export const toInput = (form: FormState): ScheduleInput => ({
  title: form.title,
  date: form.date,
  time: form.time,
  durationMin: form.durationMin,
  timezone: form.timezone,
  invitees: form.invitees,
  passcodeOn: form.passcodeOn,
  passcode: form.passcode,
})

/** Editing a whole series only moves its time of day, so the "already past" check does not apply. */
export function validateForm(form: FormState, mode: FormMode, now: Date, hasSource: boolean): ScheduleErrors {
  const errors = validateSchedule(toInput(form), now)
  if (mode === 'edit' && hasSource && form.scope === 'series' && errors.when?.includes('lewat')) delete errors.when
  return errors
}

const securityOf = (form: FormState) => ({ passcode: form.passcodeOn ? form.passcode : null, waitingRoom: form.waitingRoom, muteOnJoin: form.muteOnJoin })
const clean = (text: string) => text.replace(/\s+/g, ' ').trim()

export interface IdSource {
  readonly newId: () => string
  readonly newCode: () => string
}

export const defaultIds: IdSource = {
  newId: () => (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
  newCode: () => generateMeetingCode(),
}

/** Turns a validated form into the change to apply. Call only when validateForm found nothing. */
export function buildResult(mode: FormMode, form: FormState, source: FormSource | undefined, ids: IdSource = defaultIds): ScheduleResult {
  const start = zonedToUtc(form.date, form.time, form.timezone)
  const fields = {
    title: clean(form.title),
    description: form.description.trim(),
    durationMin: form.durationMin,
    timezone: form.timezone,
    invitees: form.invitees,
    security: securityOf(form),
  }

  if (mode === 'edit' && source) {
    const { meeting } = source
    const code = form.room === 'mine' ? MY_ROOM_CODE : meeting.code
    if (form.scope === 'single' && meeting.recurrence !== 'none') {
      const replacement: Meeting = { ...meeting, ...fields, code, id: ids.newId(), startsAt: start.toISOString(), recurrence: 'none', skipped: [], cancelled: false }
      return { kind: 'single', id: meeting.id, startIso: source.occurrence.start.toISOString(), meeting: replacement, start }
    }
    // whole series: keep the first session's date, change its time of day
    const baseDate = utcToZoned(new Date(meeting.startsAt), form.timezone).date
    const startsAt = zonedToUtc(baseDate, form.time, form.timezone).toISOString()
    const updated: Meeting = { ...meeting, ...fields, code, startsAt, recurrence: form.recurrence }
    return { kind: 'series', id: meeting.id, meeting: updated, start }
  }

  const code = form.room === 'mine' ? MY_ROOM_CODE : ids.newCode()
  const meeting: Meeting = {
    ...fields,
    id: ids.newId(),
    code,
    startsAt: start.toISOString(),
    recurrence: form.recurrence,
    hostName: USER_NAME,
    isHost: true,
    cancelled: false,
    skipped: [],
  }
  return { kind: 'create', meeting, start }
}
