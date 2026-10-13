import { ALL_PARTICIPANTS, VISIBLE_COUNT } from '../demo/participants'
import type { DockToggle, PanelName, RoomState, VoiceSource } from './types'

export type RoomAction =
  | { type: 'toggleMic'; id: string }
  | { type: 'toggleCam'; id: string }
  | { type: 'setMic'; id: string; on: boolean }
  | { type: 'toggleDock'; key: DockToggle }
  | { type: 'togglePanel'; panel: PanelName }
  | { type: 'patchVoice'; id: string; patch: Partial<VoiceSource> }
  | { type: 'applyVoicePreset'; preset: VoicePreset }

export type VoicePreset = 'silence' | 'solo' | 'crowd'

export const DEFAULT_LEVEL = 0.6
const IDLE_VOICE: VoiceSource = { talking: false, level: DEFAULT_LEVEL, natural: false }

const participants = ALL_PARTICIPANTS.slice(0, VISIBLE_COUNT)

export const initialRoomState: RoomState = {
  participants,
  voice: Object.fromEntries(participants.map((p) => [p.id, IDLE_VOICE])),
  toggles: { share: false, reaction: false, hand: false, highFive: false, soundboard: false, more: false },
  panel: null,
}

/** Who talks in each mass preset, and how loudly. */
const PRESETS: Record<VoicePreset, Readonly<Record<string, number>>> = {
  silence: {},
  solo: { dewi: 0.7 },
  crowd: { dewi: 0.75, bima: 0.9, raka: 0.55 },
}

export function roomReducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    case 'toggleMic':
      return setMic(state, action.id, !state.participants.find((p) => p.id === action.id)?.micOn)
    case 'setMic':
      return setMic(state, action.id, action.on)
    case 'toggleCam':
      return {
        ...state,
        participants: state.participants.map((p) => (p.id === action.id ? { ...p, camOn: !p.camOn } : p)),
      }
    case 'toggleDock':
      return { ...state, toggles: { ...state.toggles, [action.key]: !state.toggles[action.key] } }
    case 'togglePanel':
      return { ...state, panel: state.panel === action.panel ? null : action.panel }
    case 'patchVoice':
      return {
        ...state,
        voice: { ...state.voice, [action.id]: { ...state.voice[action.id], ...action.patch } },
      }
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
  }
}

function setMic(state: RoomState, id: string, on: boolean): RoomState {
  return {
    ...state,
    participants: state.participants.map((p) => (p.id === id ? { ...p, micOn: on } : p)),
  }
}
