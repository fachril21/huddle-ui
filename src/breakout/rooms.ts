import { MAIN_ROOM, SELF_ID } from '../state/types'
import type { BreakoutState, ChatMessage, Participant, RoomState } from '../state/types'

/** Time between "rooms are closing" and everyone being back in the main room */
export const CLOSING_MS = 60_000
export const MIN_ROOMS = 2
export const MAX_ROOMS = 8
export const MAX_ROOM_NAME = 24
/** Warn this long before the auto-close timer runs out */
export const TIMER_WARNING_MS = 60_000

/** Each room borrows one aurora hue; the name and the icon carry the identity, the hue only helps. */
export const ROOM_TONES = ['cyan', 'mint', 'violet', 'amber', 'rose'] as const
export type RoomTone = (typeof ROOM_TONES)[number]

export function roomTone(index: number): RoomTone {
  return ROOM_TONES[((index % ROOM_TONES.length) + ROOM_TONES.length) % ROOM_TONES.length]
}

export const isLive = (b: BreakoutState): boolean => b.phase === 'open' || b.phase === 'closing'

export const locationOf = (b: BreakoutState, id: string): string => b.where[id] ?? MAIN_ROOM

export const isManager = (p: Participant): boolean => p.role === 'Host' || p.role === 'Co-host'

export function roomName(b: BreakoutState, roomId: string): string {
  return roomId === MAIN_ROOM ? 'Ruang utama' : (b.rooms.find((r) => r.id === roomId)?.name ?? 'Ruang utama')
}

export function toneOfRoom(b: BreakoutState, roomId: string): RoomTone {
  return roomTone(Math.max(0, b.rooms.findIndex((r) => r.id === roomId)))
}

/** Everyone in the meeting who is in this room right now */
export function membersOf(state: RoomState, roomId: string): Participant[] {
  return state.participants.filter((p) => locationOf(state.breakout, p.id) === roomId)
}

/** People who are in the main room and have no room of their own: late arrivals, or anyone the host left out */
export function unplacedIds(state: RoomState): string[] {
  const b = state.breakout
  return state.participants.filter((p) => !isManager(p) && !b.assignment[p.id]).map((p) => p.id)
}

/** Round-robin split so room sizes differ by at most one */
export function splitEvenly(ids: readonly string[], roomIds: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {}
  if (roomIds.length === 0) return out
  ids.forEach((id, i) => {
    out[id] = roomIds[i % roomIds.length]
  })
  return out
}

export const roomIdFor = (n: number): string => `r${n}`

/** Where this person has been asked to go, if they are not there yet */
export function invitationFor(b: BreakoutState, id: string): string | null {
  if (b.phase !== 'open') return null
  const target = b.assignment[id]
  return target && locationOf(b, id) !== target ? target : null
}

/** Milliseconds left on the auto-close timer, null when there is none */
export function timeLeftMs(b: BreakoutState, now: number): number | null {
  if (b.phase === 'closing' && b.closingEndsAt !== null) return Math.max(0, b.closingEndsAt - now)
  return b.closesAt === null ? null : Math.max(0, b.closesAt - now)
}

/** "8:05" */
export function clockLabel(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/**
 * What the user can see from the room they are in. While Ruang diskusi are live, tiles, chat, reactions, sounds,
 * high fives and screen shares belong to one room; every component downstream reads this instead of the whole meeting.
 */
export function scopedState(state: RoomState): RoomState {
  const b = state.breakout
  if (!isLive(b)) return state
  const room = locationOf(b, SELF_ID)
  const here = (id: string): boolean => locationOf(b, id) === room
  const visible = (m: ChatMessage): boolean => m.toId !== null || (m.roomId ?? MAIN_ROOM) === room
  const seen = state.chat.messages.slice(0, state.chat.readCount).filter(visible).length
  const sharerId = state.sharerId && here(state.sharerId) ? state.sharerId : null
  const away = state.participants.filter((p) => !here(p.id))
  const hf = state.highFive
  return {
    ...state,
    participants: state.participants.filter((p) => here(p.id)),
    // names of people in other rooms still resolve (private messages, notices)
    bench: [...state.bench, ...away],
    chat: { ...state.chat, messages: state.chat.messages.filter(visible), readCount: seen },
    reactions: state.reactions.filter((r) => here(r.senderId)),
    highFive: {
      ...hf,
      offers: hf.offers.filter((o) => here(o.fromId)),
      matches: hf.matches.filter((m) => here(m.aId) && here(m.bId)),
      claims: hf.claims.filter((c) => here(c.fromId)),
    },
    soundboard: { ...state.soundboard, plays: state.soundboard.plays.filter((p) => here(p.fromId)) },
    sharerId,
    annotation: { ...state.annotation, strokes: sharerId ? state.annotation.strokes : [] },
    polls: room === MAIN_ROOM ? state.polls : [],
    host: { ...state.host, announcement: room === MAIN_ROOM ? state.host.announcement : b.broadcast && { id: b.broadcast.id, text: b.broadcast.text } },
  }
}
