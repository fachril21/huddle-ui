import type { Notice, Participant, Role, RoomState } from '../types'

export type Slice = (state: RoomState, action: import('../actions').RoomAction) => RoomState | undefined

export function nextId(items: readonly { id: number }[]): number {
  return Math.max(0, ...items.map((i) => i.id)) + 1
}

export const NOTICE_MS = 4000
const MAX_NOTICES = 3

/** Append a short-lived notice chip ("Budi disetujui masuk"). */
export function withNotice(state: RoomState, text: string, now: number): RoomState {
  const notice: Notice = { id: nextId(state.notices), text, at: now }
  return { ...state, notices: [...state.notices, notice].slice(-MAX_NOTICES) }
}

export function mapParticipant(state: RoomState, id: string, fn: (p: Participant) => Participant): RoomState {
  return { ...state, participants: state.participants.map((p) => (p.id === id ? fn(p) : p)) }
}

export function canManage(role: Role): boolean {
  return role === 'Host' || role === 'Co-host'
}

export function roleOf(state: RoomState, id: string): Role | undefined {
  return state.participants.find((p) => p.id === id)?.role
}
