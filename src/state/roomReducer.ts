import { ALL_PARTICIPANTS, VISIBLE_COUNT } from '../demo/participants'
import type {
  ConnectionState,
  DockToggle,
  PanelName,
  Participant,
  PresenceStatus,
  ReactionName,
  RoomState,
  VoiceSource,
} from './types'

export type VoicePreset = 'silence' | 'solo' | 'crowd'

export type RoomAction =
  | { type: 'toggleMic'; id: string }
  | { type: 'toggleCam'; id: string }
  | { type: 'setMic'; id: string; on: boolean }
  | { type: 'moveParticipant'; id: string; toIndex: number }
  | { type: 'toggleHand'; id: string }
  | { type: 'toggleStatus'; id: string; status: Exclude<PresenceStatus, 'none'> }
  | { type: 'toggleConnection'; id: string; connection: Exclude<ConnectionState, 'good'> }
  | { type: 'toggleDock'; key: DockToggle }
  | { type: 'closeDock'; key: DockToggle }
  | { type: 'togglePanel'; panel: PanelName }
  | { type: 'patchVoice'; id: string; patch: Partial<VoiceSource> }
  | { type: 'applyVoicePreset'; preset: VoicePreset }
  | { type: 'react'; senderId: string; name: ReactionName; x: number; now: number }
  | { type: 'expireReactions'; now: number }
  | { type: 'startShare'; id: string }
  | { type: 'stopShare' }
  | { type: 'hfOffer'; fromId: string; now: number }
  | { type: 'hfCancel'; fromId: string }
  | { type: 'hfRespond'; fromId: string; byId: string; now: number }
  | { type: 'hfTick'; now: number }
  | { type: 'hfMatchDone'; id: number }

export const DEFAULT_LEVEL = 0.6
const IDLE_VOICE: VoiceSource = { talking: false, level: DEFAULT_LEVEL, natural: false }

/** Reactions merge when the same sender repeats the same emoji inside this window (Design.md 10.2). */
const REACTION_MERGE_MS = 1000
/** A floating reaction lives this long on screen. */
export const REACTION_LIFETIME_MS = 3800
/** At most this many floating emoji at once; oldest are dropped first. */
const MAX_REACTIONS = 12

/** An open offer hangs for 6 seconds (Design.md 11.3), then the sender waits 3 seconds before offering again. */
export const HF_OFFER_MS = 6000
export const HF_COOLDOWN_MS = 3000
export const HF_CLAIM_TOAST_MS = 1800

const participants = ALL_PARTICIPANTS.slice(0, VISIBLE_COUNT)

export const initialRoomState: RoomState = {
  participants,
  voice: Object.fromEntries(participants.map((p) => [p.id, IDLE_VOICE])),
  toggles: { reaction: false, soundboard: false, more: false },
  panel: null,
  reactions: [],
  highFive: { offers: [], matches: [], claims: [], cooldowns: {} },
  sharerId: null,
}

/** Who talks in each mass preset, and how loudly. */
const PRESETS: Record<VoicePreset, Readonly<Record<string, number>>> = {
  silence: {},
  solo: { dewi: 0.7 },
  crowd: { dewi: 0.75, bima: 0.9, raka: 0.55 },
}

function mapParticipant(state: RoomState, id: string, fn: (p: Participant) => Participant): RoomState {
  return { ...state, participants: state.participants.map((p) => (p.id === id ? fn(p) : p)) }
}

export function roomReducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    case 'toggleMic':
      return mapParticipant(state, action.id, (p) => ({ ...p, micOn: !p.micOn }))
    case 'setMic':
      return mapParticipant(state, action.id, (p) => ({ ...p, micOn: action.on }))
    case 'toggleCam':
      return mapParticipant(state, action.id, (p) => ({ ...p, camOn: !p.camOn }))
    case 'moveParticipant': {
      const from = state.participants.findIndex((p) => p.id === action.id)
      const to = Math.max(0, Math.min(state.participants.length - 1, action.toIndex))
      if (from < 0 || from === to) return state
      const next = [...state.participants]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return { ...state, participants: next }
    }
    case 'toggleHand': {
      const nextSeq = Math.max(0, ...state.participants.map((p) => p.hand ?? 0)) + 1
      return mapParticipant(state, action.id, (p) => ({ ...p, hand: p.hand === null ? nextSeq : null }))
    }
    case 'toggleStatus':
      return mapParticipant(state, action.id, (p) => ({ ...p, status: p.status === action.status ? 'none' : action.status }))
    case 'toggleConnection':
      return mapParticipant(state, action.id, (p) => ({
        ...p,
        connection: p.connection === action.connection ? 'good' : action.connection,
      }))
    case 'toggleDock':
      return { ...state, toggles: { ...state.toggles, [action.key]: !state.toggles[action.key] } }
    case 'closeDock':
      return state.toggles[action.key] ? { ...state, toggles: { ...state.toggles, [action.key]: false } } : state
    case 'togglePanel':
      return { ...state, panel: state.panel === action.panel ? null : action.panel }
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
      return { ...state, voice, participants: unmuted }
    }
    case 'react':
      return addReaction(state, action)
    case 'startShare':
      return state.sharerId === null ? { ...state, sharerId: action.id } : state
    case 'stopShare':
      return { ...state, sharerId: null }
    case 'hfOffer': {
      const hf = state.highFive
      const busy = hf.offers.some((o) => o.fromId === action.fromId)
      if (busy || action.now < (hf.cooldowns[action.fromId] ?? 0)) return state
      const id = nextId([...hf.offers, ...hf.claims.map((c) => ({ id: c.offerId }))])
      const offer = { id, fromId: action.fromId, startedAt: action.now, expiresAt: action.now + HF_OFFER_MS }
      return { ...state, highFive: { ...hf, offers: [...hf.offers, offer] } }
    }
    case 'hfCancel':
      return { ...state, highFive: { ...state.highFive, offers: state.highFive.offers.filter((o) => o.fromId !== action.fromId) } }
    case 'hfRespond': {
      const hf = state.highFive
      const offer = hf.offers.find((o) => o.fromId === action.fromId)
      if (!offer || action.byId === action.fromId || action.now >= offer.expiresAt) return state
      const match = { id: nextId(hf.matches), aId: offer.fromId, bId: action.byId }
      const claim = { offerId: offer.id, fromId: offer.fromId, byId: action.byId, at: action.now }
      return {
        ...state,
        highFive: { ...hf, offers: hf.offers.filter((o) => o.id !== offer.id), matches: [...hf.matches, match], claims: [...hf.claims, claim] },
      }
    }
    case 'hfTick': {
      const hf = state.highFive
      const expired = hf.offers.filter((o) => action.now >= o.expiresAt)
      const claims = hf.claims.filter((c) => action.now - c.at < HF_CLAIM_TOAST_MS)
      if (!expired.length && claims.length === hf.claims.length) return state
      const cooldowns = { ...hf.cooldowns }
      for (const o of expired) cooldowns[o.fromId] = action.now + HF_COOLDOWN_MS
      return { ...state, highFive: { ...hf, offers: hf.offers.filter((o) => action.now < o.expiresAt), claims, cooldowns } }
    }
    case 'hfMatchDone':
      return { ...state, highFive: { ...state.highFive, matches: state.highFive.matches.filter((m) => m.id !== action.id) } }
    case 'expireReactions': {
      const alive = state.reactions.filter((r) => action.now - r.createdAt < REACTION_LIFETIME_MS)
      return alive.length === state.reactions.length ? state : { ...state, reactions: alive }
    }
  }
}

function addReaction(state: RoomState, a: Extract<RoomAction, { type: 'react' }>): RoomState {
  const recent = [...state.reactions]
    .reverse()
    .find((r) => r.senderId === a.senderId && r.name === a.name && a.now - r.updatedAt < REACTION_MERGE_MS)
  if (recent) {
    return {
      ...state,
      reactions: state.reactions.map((r) => (r.id === recent.id ? { ...r, count: r.count + 1, updatedAt: a.now } : r)),
    }
  }
  const id = Math.max(0, ...state.reactions.map((r) => r.id)) + 1
  const next = [...state.reactions, { id, senderId: a.senderId, name: a.name, count: 1, x: a.x, createdAt: a.now, updatedAt: a.now }]
  return { ...state, reactions: next.slice(-MAX_REACTIONS) }
}

function nextId(items: readonly { id: number }[]): number {
  return Math.max(0, ...items.map((i) => i.id)) + 1
}
