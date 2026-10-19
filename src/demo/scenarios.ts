import { SOUND_BY_ID } from '../audio/soundboardSounds'
import { SAMPLE_POLL } from '../features/polls/pollMath'
import type { RoomAction } from '../state/roomReducer'
import { doodleStroke } from './doodles'
import type { DoodleKind } from './doodles'
import type { AnnotationColor } from '../state/types'
import { SELF_ID } from '../state/types'

/** One timed event. `run` receives performance.now() so time-based actions (cooldowns, expiry) line up. */
export interface ScenarioStep {
  readonly at: number
  readonly run: (now: number) => RoomAction[]
}

export interface Scenario {
  readonly id: string
  readonly name: string
  readonly durationS: number
  /** Brainstorm sprint ends on the closing screen; the short ones just stop */
  readonly endsMeeting?: boolean
  readonly steps: readonly ScenarioStep[]
}

const mm = (m: number, s: number) => m * 60 + s

const talk = (id: string, level: number): ScenarioStep['run'] => () => [{ type: 'patchVoice', id, patch: { talking: true, natural: true, level } }]
const hush = (id: string): ScenarioStep['run'] => () => [{ type: 'patchVoice', id, patch: { talking: false } }]
const silence: ScenarioStep['run'] = () => [{ type: 'applyVoicePreset', preset: 'silence' }]
const hand = (id: string): ScenarioStep['run'] => () => [{ type: 'toggleHand', id }]
const react = (senderId: string, name: Extract<RoomAction, { type: 'react' }>['name'], x: number): ScenarioStep['run'] => (now) => [{ type: 'react', senderId, name, x, now }]
const offer = (fromId: string): ScenarioStep['run'] => (now) => [{ type: 'hfOffer', fromId, now }]
const accept = (fromId: string, byId: string): ScenarioStep['run'] => (now) => [{ type: 'hfRespond', fromId, byId, now }]
const play = (fromId: string, soundId: string): ScenarioStep['run'] => (now) => [{ type: 'sbPlay', fromId, soundId, durationMs: SOUND_BY_ID[soundId].durationMs, now }]
const doodle = (kind: DoodleKind, authorId: string, color: AnnotationColor): ScenarioStep['run'] => (now) => [{ type: 'annotationAdd', stroke: doodleStroke(kind, authorId, color, now, 8000) }]
const startPoll = (creatorId: string): ScenarioStep['run'] => (now) => [
  {
    type: 'pollStart',
    poll: {
      question: SAMPLE_POLL.question,
      options: SAMPLE_POLL.options.map((text, i) => ({ id: `o${i + 1}`, text })),
      multiple: false,
      anonymous: true,
      liveResults: true,
      autoCloseS: null,
      startedAt: now,
      creatorId,
    },
  },
]

/** "Brainstorm sprint", about four minutes (PRD 10). */
const BRAINSTORM: Scenario = {
  id: 'brainstorm',
  name: 'Brainstorm sprint (±4 mnt)',
  durationS: mm(3, 52),
  endsMeeting: true,
  steps: [
    { at: mm(0, 10), run: talk('dewi', 0.35) },
    { at: mm(0, 16), run: talk('dewi', 0.65) },
    { at: mm(0, 25), run: talk('bima', 0.85) },
    { at: mm(0, 40), run: talk('bima', 1) },
    { at: mm(0, 46), run: talk('bima', 0.8) },
    { at: mm(0, 50), run: silence },
    { at: mm(0, 55), run: hand('sari') },
    { at: mm(0, 57), run: hand('fajar') },
    { at: mm(1, 10), run: react('maya', 'heart', 40) },
    { at: mm(1, 12), run: react('sari', 'clap', 110) },
    { at: mm(1, 14), run: react('bima', 'fire', 170) },
    { at: mm(1, 15), run: react('bima', 'fire', 170) },
    { at: mm(1, 25), run: talk('dewi', 0.6) },
    { at: mm(1, 25), run: offer('raka') },
    { at: mm(1, 30), run: accept('raka', 'dewi') },
    { at: mm(1, 40), run: hush('dewi') },
    { at: mm(1, 45), run: offer('andi') },
    { at: mm(1, 53), run: () => [{ type: 'toggleDock', key: 'soundboard' }] },
    { at: mm(1, 55), run: play(SELF_ID, 'tada') },
    { at: mm(1, 59), run: play('fajar', 'clap') },
    { at: mm(2, 3), run: () => [{ type: 'closeDock', key: 'soundboard' }] },
    { at: mm(2, 15), run: () => [{ type: 'openPanel', panel: 'polling' }] },
    { at: mm(2, 17), run: startPoll(SELF_ID) },
    { at: mm(2, 50), run: () => [{ type: 'pollClose' }] },
    { at: mm(2, 57), run: () => [{ type: 'openPanel', panel: null }] },
    { at: mm(3, 0), run: () => [{ type: 'startShare', id: 'raka' }] },
    { at: mm(3, 8), run: doodle('circle', 'dewi', 'rose') },
    { at: mm(3, 16), run: doodle('underline', 'bima', 'blue') },
    { at: mm(3, 20), run: talk('dewi', 0.6) },
    { at: mm(3, 28), run: doodle('arrow', 'sari', 'violet') },
    { at: mm(3, 35), run: hush('dewi') },
    { at: mm(3, 40), run: () => [{ type: 'stopShare' }] },
  ],
}

const AURORA: Scenario = {
  id: 'aurora',
  name: 'Aurora saja (30 dtk)',
  durationS: 30,
  steps: [
    { at: 2, run: talk('dewi', 0.3) },
    { at: 6, run: talk('dewi', 0.7) },
    { at: 9, run: talk('bima', 0.9) },
    { at: 13, run: talk('raka', 0.6) },
    { at: 19, run: hush('bima') },
    { at: 21, run: talk('dewi', 0.2) },
    { at: 25, run: silence },
  ],
}

const HIGH_FIVE: Scenario = {
  id: 'highfive',
  name: 'High five saja (25 dtk)',
  durationS: 25,
  steps: [
    { at: 2, run: offer('dewi') },
    { at: 4, run: accept('dewi', 'raka') },
    { at: 9, run: offer('bima') },
    { at: 11, run: accept('bima', SELF_ID) },
    { at: 16, run: offer('andi') },
  ],
}

const SHARE: Scenario = {
  id: 'share',
  name: 'Share screen saja (30 dtk)',
  durationS: 30,
  steps: [
    { at: 2, run: () => [{ type: 'startShare', id: 'raka' }] },
    { at: 6, run: doodle('circle', 'dewi', 'rose') },
    { at: 10, run: talk('dewi', 0.6) },
    { at: 13, run: doodle('underline', 'bima', 'blue') },
    { at: 18, run: doodle('arrow', 'sari', 'violet') },
    { at: 20, run: hush('dewi') },
    { at: 24, run: () => [{ type: 'stopShare' }] },
  ],
}

const VOTING: Scenario = {
  id: 'voting',
  name: 'Voting saja (40 dtk)',
  durationS: 40,
  steps: [
    { at: 2, run: startPoll('dewi') },
    { at: 7, run: () => [{ type: 'openPanel', panel: 'polling' }] },
    { at: 10, run: () => [{ type: 'pollVote', voterId: SELF_ID, optionIds: ['o1'] }] },
    { at: 32, run: () => [{ type: 'pollClose' }] },
  ],
}

export const SCENARIOS: readonly Scenario[] = [BRAINSTORM, AURORA, HIGH_FIVE, SHARE, VOTING]
