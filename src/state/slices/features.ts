import type { Poll } from '../types'
import { nextId } from './shared'
import type { Slice } from './shared'

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

/** One sound per sender every 3 seconds, regardless of which sound (Design.md 12.3) */
export const SOUNDBOARD_COOLDOWN_MS = 3000
const MAX_SOUND_CHIPS = 3

export const reactionsSlice: Slice = (state, action) => {
  switch (action.type) {
    case 'react': {
      const recent = [...state.reactions]
        .reverse()
        .find((r) => r.senderId === action.senderId && r.name === action.name && action.now - r.updatedAt < REACTION_MERGE_MS)
      if (recent) {
        return { ...state, reactions: state.reactions.map((r) => (r.id === recent.id ? { ...r, count: r.count + 1, updatedAt: action.now } : r)) }
      }
      const item = { id: nextId(state.reactions), senderId: action.senderId, name: action.name, count: 1, x: action.x, createdAt: action.now, updatedAt: action.now }
      return { ...state, reactions: [...state.reactions, item].slice(-MAX_REACTIONS) }
    }
    case 'expireReactions': {
      const alive = state.reactions.filter((r) => action.now - r.createdAt < REACTION_LIFETIME_MS)
      return alive.length === state.reactions.length ? state : { ...state, reactions: alive }
    }
    default:
      return undefined
  }
}

export const highFiveSlice: Slice = (state, action) => {
  const hf = state.highFive
  switch (action.type) {
    case 'hfOffer': {
      const busy = hf.offers.some((o) => o.fromId === action.fromId)
      if (busy || action.now < (hf.cooldowns[action.fromId] ?? 0)) return state
      const id = nextId([...hf.offers, ...hf.claims.map((c) => ({ id: c.offerId }))])
      const offer = { id, fromId: action.fromId, startedAt: action.now, expiresAt: action.now + HF_OFFER_MS }
      return { ...state, highFive: { ...hf, offers: [...hf.offers, offer] } }
    }
    case 'hfCancel':
      return { ...state, highFive: { ...hf, offers: hf.offers.filter((o) => o.fromId !== action.fromId) } }
    case 'hfRespond': {
      const offer = hf.offers.find((o) => o.fromId === action.fromId)
      if (!offer || action.byId === action.fromId || action.now >= offer.expiresAt) return state
      const match = { id: nextId(hf.matches), aId: offer.fromId, bId: action.byId }
      const claim = { offerId: offer.id, fromId: offer.fromId, byId: action.byId, at: action.now }
      return { ...state, highFive: { ...hf, offers: hf.offers.filter((o) => o.id !== offer.id), matches: [...hf.matches, match], claims: [...hf.claims, claim] } }
    }
    case 'hfTick': {
      const expired = hf.offers.filter((o) => action.now >= o.expiresAt)
      const claims = hf.claims.filter((c) => action.now - c.at < HF_CLAIM_TOAST_MS)
      if (!expired.length && claims.length === hf.claims.length) return state
      const cooldowns = { ...hf.cooldowns }
      for (const o of expired) cooldowns[o.fromId] = action.now + HF_COOLDOWN_MS
      return { ...state, highFive: { ...hf, offers: hf.offers.filter((o) => action.now < o.expiresAt), claims, cooldowns } }
    }
    case 'hfMatchDone':
      return { ...state, highFive: { ...hf, matches: hf.matches.filter((m) => m.id !== action.id) } }
    default:
      return undefined
  }
}

export const soundboardSlice: Slice = (state, action) => {
  const sb = state.soundboard
  switch (action.type) {
    case 'sbPlay': {
      if (!sb.allowed || action.now < (sb.lastPlayAt[action.fromId] ?? 0) + SOUNDBOARD_COOLDOWN_MS) return state
      const play = { id: nextId(sb.plays), fromId: action.fromId, soundId: action.soundId, startedAt: action.now, durationMs: action.durationMs }
      return { ...state, soundboard: { ...sb, plays: [...sb.plays, play].slice(-MAX_SOUND_CHIPS), lastPlayAt: { ...sb.lastPlayAt, [action.fromId]: action.now } } }
    }
    case 'sbExpire': {
      const alive = sb.plays.filter((p) => action.now - p.startedAt < p.durationMs)
      return alive.length === sb.plays.length ? state : { ...state, soundboard: { ...sb, plays: alive } }
    }
    case 'sbAllow':
      return { ...state, soundboard: { ...sb, allowed: action.on } }
    default:
      return undefined
  }
}

export const pollsSlice: Slice = (state, action) => {
  const [current, ...rest] = state.polls
  switch (action.type) {
    case 'pollStart': {
      if (current?.status === 'active') return state
      const poll: Poll = { ...action.poll, id: nextId(state.polls), status: 'active', votes: {} }
      return { ...state, polls: [poll, ...state.polls] }
    }
    case 'pollVote': {
      if (!current || current.status !== 'active') return state
      const valid = action.optionIds.filter((o) => current.options.some((x) => x.id === o))
      if (!valid.length) return state
      const chosen = current.multiple ? valid : valid.slice(0, 1)
      return { ...state, polls: [{ ...current, votes: { ...current.votes, [action.voterId]: chosen } }, ...rest] }
    }
    case 'pollClose':
      return current?.status === 'active' ? { ...state, polls: [{ ...current, status: 'closed' }, ...rest] } : state
    case 'pollTick': {
      if (!current || current.status !== 'active' || current.autoCloseS === null) return state
      if (action.now < current.startedAt + current.autoCloseS * 1000) return state
      return { ...state, polls: [{ ...current, status: 'closed' }, ...rest] }
    }
    default:
      return undefined
  }
}
