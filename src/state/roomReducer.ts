import type { RoomAction } from './actions'
import { createInitialState, initialRoomState, DEFAULT_LEVEL } from './initialState'
import { highFiveSlice, pollsSlice, reactionsSlice, soundboardSlice } from './slices/features'
import { participantsSlice } from './slices/participants'
import { chatSlice, chromeSlice, hostSlice, sessionSlice } from './slices/session'
import type { Slice } from './slices/shared'
import type { RoomState } from './types'

export type { RoomAction, VoicePreset } from './actions'
export { createInitialState, initialRoomState, DEFAULT_LEVEL }
export { HF_CLAIM_TOAST_MS, HF_COOLDOWN_MS, HF_OFFER_MS, REACTION_LIFETIME_MS, SOUNDBOARD_COOLDOWN_MS } from './slices/features'

/** Each slice owns a family of actions and returns undefined for the rest. */
const SLICES: readonly Slice[] = [
  participantsSlice,
  chromeSlice,
  reactionsSlice,
  highFiveSlice,
  soundboardSlice,
  pollsSlice,
  chatSlice,
  hostSlice,
  sessionSlice,
]

export function roomReducer(state: RoomState, action: RoomAction): RoomState {
  for (const slice of SLICES) {
    const next = slice(state, action)
    if (next) return next
  }
  return state
}
