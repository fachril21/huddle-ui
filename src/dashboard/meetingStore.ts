import type { Meeting } from './types'

export interface MeetingState {
  readonly meetings: readonly Meeting[]
}

export type MeetingAction =
  | { type: 'add'; meeting: Meeting }
  | { type: 'update'; id: string; patch: Partial<Meeting> }
  /** Cancel the whole meeting, every session of a series included */
  | { type: 'cancelSeries'; id: string }
  /** Cancel one session of a series */
  | { type: 'cancelOccurrence'; id: string; startIso: string }
  /** Change one session only: it leaves the series and becomes a one-off meeting */
  | { type: 'editOccurrence'; id: string; startIso: string; replacement: Meeting }

const replace = (meetings: readonly Meeting[], id: string, fn: (m: Meeting) => Meeting): Meeting[] =>
  meetings.map((m) => (m.id === id ? fn(m) : m))

export function meetingReducer(state: MeetingState, action: MeetingAction): MeetingState {
  switch (action.type) {
    case 'add':
      return { meetings: [...state.meetings, action.meeting] }
    case 'update':
      return { meetings: replace(state.meetings, action.id, (m) => ({ ...m, ...action.patch })) }
    case 'cancelSeries':
      return { meetings: replace(state.meetings, action.id, (m) => ({ ...m, cancelled: true })) }
    case 'cancelOccurrence':
      return {
        meetings: replace(state.meetings, action.id, (m) =>
          m.skipped.includes(action.startIso) ? m : { ...m, skipped: [...m.skipped, action.startIso] },
        ),
      }
    case 'editOccurrence':
      return {
        meetings: [
          ...replace(state.meetings, action.id, (m) => (m.skipped.includes(action.startIso) ? m : { ...m, skipped: [...m.skipped, action.startIso] })),
          action.replacement,
        ],
      }
  }
}

export function findByCode(meetings: readonly Meeting[], code: string): Meeting | undefined {
  return meetings.find((m) => !m.cancelled && m.code === code)
}
