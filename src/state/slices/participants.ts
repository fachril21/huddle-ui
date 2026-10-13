import type { VoicePreset } from '../actions'
import { SELF_ID } from '../types'
import type { Participant, RoomState } from '../types'
import { mapParticipant, withNotice } from './shared'
import type { Slice } from './shared'

/** Who talks in each mass preset, and how loudly. */
const PRESETS: Record<VoicePreset, Readonly<Record<string, number>>> = {
  silence: {},
  solo: { dewi: 0.7 },
  crowd: { dewi: 0.75, bima: 0.9, raka: 0.55 },
}

/** Move people out of the room: they lose their hand, offer and screen share. */
function dropFromRoom(state: RoomState, ids: readonly string[]): RoomState {
  const gone = new Set(ids)
  const left = state.participants.filter((p) => gone.has(p.id))
  const leaving = left.map((p) => ({ ...p, hand: null }))
  return {
    ...state,
    participants: state.participants.filter((p) => !gone.has(p.id)),
    bench: [...leaving, ...state.bench],
    sharerId: state.sharerId && gone.has(state.sharerId) ? null : state.sharerId,
    highFive: { ...state.highFive, offers: state.highFive.offers.filter((o) => !gone.has(o.fromId)) },
  }
}

function resize(state: RoomState, count: number): RoomState {
  const target = Math.max(1, Math.min(state.participants.length + state.bench.length, count))
  const current = state.participants.length
  if (target === current) return state
  if (target > current) {
    const incoming = state.bench.slice(0, target - current)
    return { ...state, participants: [...state.participants, ...incoming], bench: state.bench.slice(incoming.length) }
  }
  const removable = state.participants.filter((p) => p.id !== SELF_ID).slice(-(current - target))
  return dropFromRoom(state, removable.map((p) => p.id))
}

function makeHost(state: RoomState, id: string): RoomState {
  const next: Participant[] = state.participants.map((p) => {
    if (p.id === id) return { ...p, role: 'Host' }
    return p.role === 'Host' ? { ...p, role: 'Co-host' } : p
  })
  return { ...state, participants: next }
}

function raiseHand(state: RoomState, id: string): RoomState {
  const nextSeq = Math.max(0, ...state.participants.map((p) => p.hand ?? 0)) + 1
  return mapParticipant(state, id, (p) => ({ ...p, hand: p.hand === null ? nextSeq : null }))
}

function move(state: RoomState, id: string, toIndex: number): RoomState {
  const from = state.participants.findIndex((p) => p.id === id)
  const to = Math.max(0, Math.min(state.participants.length - 1, toIndex))
  if (from < 0 || from === to) return state
  const next = [...state.participants]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return { ...state, participants: next }
}

function swap(state: RoomState, a: string, b: string): RoomState {
  const ia = state.participants.findIndex((p) => p.id === a)
  const ib = state.participants.findIndex((p) => p.id === b)
  if (ia < 0 || ib < 0) return state
  const next = [...state.participants]
  ;[next[ia], next[ib]] = [next[ib], next[ia]]
  return { ...state, participants: next }
}

export const participantsSlice: Slice = (state, action) => {
  switch (action.type) {
    case 'toggleMic':
      return mapParticipant(state, action.id, (p) => ({ ...p, micOn: !p.micOn }))
    case 'setMic':
      return mapParticipant(state, action.id, (p) => ({ ...p, micOn: action.on }))
    case 'toggleCam':
      return mapParticipant(state, action.id, (p) => ({ ...p, camOn: !p.camOn }))
    case 'moveParticipant':
      return move(state, action.id, action.toIndex)
    case 'swapParticipants':
      return swap(state, action.a, action.b)
    case 'toggleHand':
      return raiseHand(state, action.id)
    case 'toggleStatus':
      return mapParticipant(state, action.id, (p) => ({ ...p, status: p.status === action.status ? 'none' : action.status }))
    case 'toggleConnection':
      return mapParticipant(state, action.id, (p) => ({ ...p, connection: p.connection === action.connection ? 'good' : action.connection }))
    case 'setCount':
      return resize(state, action.count)
    case 'setRole':
      return mapParticipant(state, action.id, (p) => ({ ...p, role: action.role }))
    case 'makeHost':
      return makeHost(state, action.id)
    case 'removeParticipant': {
      const name = state.participants.find((p) => p.id === action.id)?.name
      if (!name || action.id === SELF_ID) return state
      return withNotice(dropFromRoom(state, [action.id]), `${name} dikeluarkan dari meeting`, action.now)
    }
    case 'muteAll': {
      const next = { ...state, participants: state.participants.map((p) => (p.id === SELF_ID ? p : { ...p, micOn: false })) }
      return withNotice(next, 'Semua peserta dibisukan', action.now)
    }
    case 'patchVoice':
      return { ...state, voice: { ...state.voice, [action.id]: { ...state.voice[action.id], ...action.patch } } }
    case 'applyVoicePreset': {
      const speakers = PRESETS[action.preset]
      const voice = Object.fromEntries(
        state.participants.map((p) => {
          const level = speakers[p.id]
          return [p.id, level === undefined ? { ...state.voice[p.id], talking: false } : { talking: true, level, natural: true }]
        }),
      )
      const unmuted = state.participants.map((p) => (speakers[p.id] === undefined ? p : { ...p, micOn: true }))
      return { ...state, voice: { ...state.voice, ...voice }, participants: unmuted }
    }
    default:
      return undefined
  }
}
