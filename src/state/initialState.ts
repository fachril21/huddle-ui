import { ALL_PARTICIPANTS, VISIBLE_COUNT } from '../demo/participants'
import { DEFAULT_CAMERA_QUALITY } from '../room/cameraQuality'
import { DEFAULT_DEVICES } from '../room/devices/deviceSettings'
import type { ChatMessage, RoomState, Settings, VoiceSource } from './types'

export const DEFAULT_LEVEL = 0.6
/** Demo host key shown in the Demo Director */
export const DEMO_HOST_KEY = '482913'
export const IDLE_VOICE: VoiceSource = { talking: false, level: DEFAULT_LEVEL, natural: false }

/** Mock chat history (PRD 11.4): two public messages and a private one mentioning "@Anda". */
const SEED_CHAT: readonly ChatMessage[] = [
  { id: 1, fromId: 'raka', toId: null, text: 'Selamat pagi semuanya, siap mulai brainstorm?', at: -180 },
  { id: 2, fromId: 'bima', toId: null, text: 'Siap! Saya sudah siapkan demo untuk sprint ini.', at: -120 },
  { id: 3, fromId: 'dewi', toId: 'anda', text: '@Anda boleh tolong ingatkan tim soal agenda rilis nanti?', at: -45 },
]

export const DEFAULT_SETTINGS: Settings = { fx: 'full', cameraQuality: DEFAULT_CAMERA_QUALITY, devices: DEFAULT_DEVICES, layout: { mode: 'gallery', pinnedId: null, hideNoVideo: false }, simulateReduced: false }

/** Fresh meeting state. Visual settings survive a "Mulai ulang demo". */
export function createInitialState(settings: Settings = DEFAULT_SETTINGS): RoomState {
  const participants = ALL_PARTICIPANTS.slice(0, VISIBLE_COUNT)
  return {
    participants,
    bench: ALL_PARTICIPANTS.slice(VISIBLE_COUNT),
    voice: Object.fromEntries(ALL_PARTICIPANTS.map((p) => [p.id, IDLE_VOICE])),
    toggles: { reaction: false, soundboard: false, more: false, mic: false, camera: false, leave: false },
    panel: null,
    reactions: [],
    highFive: { offers: [], matches: [], claims: [], cooldowns: {} },
    sharerId: null,
    soundboard: { allowed: true, plays: [], lastPlayAt: {} },
    polls: [],
    chat: { messages: SEED_CHAT, typingId: null, readCount: 2 },
    annotation: { allowed: true, strokes: [] },
    host: { locked: false, hostKey: DEMO_HOST_KEY, restrictShare: false, recording: 'off', consented: false, waiting: [], announcement: null },
    notices: [],
    phase: 'live',
    settings,
  }
}

export const initialRoomState: RoomState = createInitialState()
