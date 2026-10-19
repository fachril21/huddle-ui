import { CLOSING_MS, MAX_ROOMS, MAX_ROOM_NAME, MIN_ROOMS, isLive, isManager, locationOf, roomIdFor, splitEvenly } from '../../breakout/rooms'
import { NO_BREAKOUT } from '../initialState'
import { MAIN_ROOM, SELF_ID } from '../types'
import type { BreakoutState, ChatMessage, RoomState } from '../types'
import { hasHost, nextId, withNotice } from './shared'
import type { Slice } from './shared'

const withBreakout = (state: RoomState, breakout: BreakoutState): RoomState => ({ ...state, breakout })

const roomExists = (b: BreakoutState, roomId: string): boolean => b.rooms.some((r) => r.id === roomId)

/** Put everyone back in the main room, keeping the placements so the rooms can open again the same way. */
function finish(state: RoomState, now: number): RoomState {
  const b = state.breakout
  const next = withBreakout(state, { ...b, phase: 'prepared', where: {}, openedAt: null, closesAt: null, closingEndsAt: null, help: [], broadcast: null })
  return withNotice(next, 'Ruang diskusi ditutup, semua kembali ke ruang utama', now)
}

function openRooms(state: RoomState, now: number): RoomState {
  const b = state.breakout
  if (b.phase !== 'prepared') return state
  const where: Record<string, string> = {}
  if (b.options.autoMove) {
    for (const p of state.participants) {
      const target = b.assignment[p.id]
      if (target && !isManager(p)) where[p.id] = target
    }
  }
  const closesAt = b.options.autoCloseMin === null ? null : now + b.options.autoCloseMin * 60_000
  return withNotice(withBreakout(state, { ...b, phase: 'open', where, openedAt: now, closesAt, closingEndsAt: null, help: [], broadcast: null }), 'Ruang diskusi dibuka', now)
}

function broadcast(state: RoomState, fromId: string, text: string, now: number): RoomState {
  const b = state.breakout
  const body = text.trim()
  if (!isLive(b) || !body) return state
  let messages = state.chat.messages
  for (const room of b.rooms) {
    const message: ChatMessage = { id: nextId(messages), fromId, toId: null, text: body, at: Math.round(now / 1000), roomId: room.id }
    messages = [...messages, message]
  }
  const id = (b.broadcast?.id ?? 0) + 1
  return { ...state, chat: { ...state.chat, messages }, breakout: { ...b, broadcast: { id, text: body, at: now } } }
}

/** Placing someone while the rooms are open moves them straight away if they are already in a room (or auto-move is on). */
function assign(state: RoomState, id: string, roomId: string | null): RoomState {
  const b = state.breakout
  const person = state.participants.find((p) => p.id === id)
  if (!person || b.phase === 'off' || b.phase === 'closing') return state
  if (roomId !== null && !roomExists(b, roomId)) return state
  const assignment = { ...b.assignment, [id]: roomId }
  let where = b.where
  if (b.phase === 'open') {
    const current = locationOf(b, id)
    if (roomId === null) where = omit(where, id)
    else if (current !== MAIN_ROOM || b.options.autoMove) where = { ...where, [id]: roomId }
  }
  return withBreakout(state, { ...b, assignment, where })
}

function omit<T>(record: Readonly<Record<string, T>>, key: string): Record<string, T> {
  const { [key]: _removed, ...rest } = record
  return rest
}

function join(state: RoomState, id: string, roomId: string): RoomState {
  const b = state.breakout
  const person = state.participants.find((p) => p.id === id)
  if (b.phase !== 'open' || !person || !roomExists(b, roomId)) return state
  const manager = isManager(person)
  const here = locationOf(b, id)
  if (here === roomId) return state
  const allowed = manager || b.mode === 'choice' || b.assignment[id] === roomId
  // someone who may not roam can enter their room but not hop between rooms
  const roams = manager || b.options.allowReturn || here === MAIN_ROOM
  if (!allowed || !roams) return state
  return withBreakout(state, { ...b, where: { ...b.where, [id]: roomId } })
}

function leave(state: RoomState, id: string): RoomState {
  const b = state.breakout
  const person = state.participants.find((p) => p.id === id)
  if (!isLive(b) || !person || locationOf(b, id) === MAIN_ROOM) return state
  if (!isManager(person) && !b.options.allowReturn && b.phase !== 'closing') return state
  return withBreakout(state, { ...b, where: omit(b.where, id) })
}

function help(state: RoomState, id: string, now: number): RoomState {
  const b = state.breakout
  const roomId = locationOf(b, id)
  if (b.phase !== 'open' || roomId === MAIN_ROOM || b.help.some((h) => h.byId === id)) return state
  return withBreakout(state, { ...b, help: [...b.help, { roomId, byId: id, at: now }] })
}

function tick(state: RoomState, now: number): RoomState {
  const b = state.breakout
  if (b.phase === 'open' && b.closesAt !== null && now >= b.closesAt) {
    return withNotice(withBreakout(state, { ...b, phase: 'closing', closesAt: null, closingEndsAt: now + CLOSING_MS }), 'Waktu habis, ruang ditutup dalam 60 detik', now)
  }
  if (b.phase === 'closing' && b.closingEndsAt !== null && now >= b.closingEndsAt) return finish(state, now)
  return state
}

function close(state: RoomState, now: number, immediate: boolean): RoomState {
  const b = state.breakout
  if (b.phase !== 'open') return state
  if (immediate) return finish(state, now)
  return withBreakout(state, { ...b, phase: 'closing', closesAt: null, closingEndsAt: now + CLOSING_MS })
}

function create(state: RoomState, count: number, mode: BreakoutState['mode'], options: BreakoutState['options']): RoomState {
  if (state.breakout.phase !== 'off' && state.breakout.phase !== 'prepared') return state
  const total = Math.max(MIN_ROOMS, Math.min(MAX_ROOMS, Math.round(count)))
  const rooms = Array.from({ length: total }, (_, i) => ({ id: roomIdFor(i + 1), name: `Ruang ${i + 1}` }))
  const people = state.participants.filter((p) => !isManager(p)).map((p) => p.id)
  const assignment = mode === 'auto' ? splitEvenly(people, rooms.map((r) => r.id)) : {}
  return withBreakout(state, { ...NO_BREAKOUT, phase: 'prepared', mode, rooms, assignment, options })
}

export const breakoutSlice: Slice = (state, action) => {
  const b = state.breakout
  switch (action.type) {
    case 'breakoutCreate':
      return create(state, action.count, action.mode, action.options)
    case 'breakoutShuffle': {
      if (b.phase !== 'prepared') return state
      const known = new Set(state.participants.filter((p) => !isManager(p)).map((p) => p.id))
      const order = action.order.filter((id) => known.has(id))
      return withBreakout(state, { ...b, assignment: splitEvenly(order, b.rooms.map((r) => r.id)) })
    }
    case 'breakoutAssign':
      return assign(state, action.id, action.roomId)
    case 'breakoutAddRoom': {
      if (b.phase === 'off' || b.phase === 'closing' || b.rooms.length >= MAX_ROOMS) return state
      const n = Math.max(0, ...b.rooms.map((r) => Number(r.id.slice(1)))) + 1
      return withBreakout(state, { ...b, rooms: [...b.rooms, { id: roomIdFor(n), name: `Ruang ${n}` }] })
    }
    case 'breakoutRemoveRoom': {
      const occupied = state.participants.some((p) => locationOf(b, p.id) === action.roomId)
      const placed = Object.values(b.assignment).includes(action.roomId)
      if (b.phase === 'off' || b.phase === 'closing' || b.rooms.length <= MIN_ROOMS || occupied || placed || !roomExists(b, action.roomId)) return state
      return withBreakout(state, { ...b, rooms: b.rooms.filter((r) => r.id !== action.roomId) })
    }
    case 'breakoutRenameRoom': {
      const name = action.name.trim().slice(0, MAX_ROOM_NAME)
      if (!name || !roomExists(b, action.roomId)) return state
      return withBreakout(state, { ...b, rooms: b.rooms.map((r) => (r.id === action.roomId ? { ...r, name } : r)) })
    }
    case 'breakoutOptions':
      return b.phase === 'off' ? state : withBreakout(state, { ...b, options: { ...b.options, ...action.options } })
    case 'breakoutOpen':
      return openRooms(state, action.now)
    case 'breakoutJoin':
      return join(state, action.id, action.roomId)
    case 'breakoutLeave':
      return leave(state, action.id)
    case 'breakoutHelp':
      return help(state, action.id, action.now)
    case 'breakoutHelpDone':
      return withBreakout(state, { ...b, help: b.help.filter((h) => h.roomId !== action.roomId) })
    case 'breakoutBroadcast':
      return broadcast(state, action.fromId, action.text, action.now)
    case 'breakoutClose':
      return close(state, action.now, action.immediate === true)
    case 'breakoutTick':
      return tick(state, action.now)
    case 'breakoutDiscard':
      return b.phase === 'prepared' ? withBreakout(state, NO_BREAKOUT) : state
    case 'dismissAnnouncement':
      // inside a room the banner shows the host's broadcast, so dismissing it clears that, not the main-room announcement
      return isLive(b) && locationOf(b, SELF_ID) !== MAIN_ROOM && b.broadcast ? withBreakout(state, { ...b, broadcast: null }) : undefined
    default:
      return undefined
  }
}

/** Keeps the breakout state honest after any action: people who left are forgotten, and no host means no rooms. */
export function tidyBreakout(state: RoomState): RoomState {
  const b = state.breakout
  if (b.phase === 'off') return state
  if (isLive(b) && !hasHost(state)) return finish(state, performance.now())
  const present = new Set(state.participants.map((p) => p.id))
  const stale = (id: string): boolean => !present.has(id)
  const hasStale = Object.keys(b.assignment).some(stale) || Object.keys(b.where).some(stale) || b.help.some((h) => stale(h.byId))
  if (!hasStale) return state
  const keep = <T,>(record: Readonly<Record<string, T>>): Record<string, T> => Object.fromEntries(Object.entries(record).filter(([id]) => !stale(id)))
  return withBreakout(state, { ...b, assignment: keep(b.assignment), where: keep(b.where), help: b.help.filter((h) => !stale(h.byId)) })
}
