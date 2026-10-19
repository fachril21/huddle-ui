import { getAudio, onAudioReady } from './audioEngine'
import { bytesOf } from './fileSounds'
import type { EmojiName } from '../emoji/registry'

/**
 * The 12 built-in soundboard sounds (PRD 11.2). The audio lives in `soundboard/*.mp3`, prepared by
 * `scripts/build-soundboard-audio.sh` from `assets/source-audio/Soundboard`. Every sound is at most 5 seconds (Design.md 12.3).
 */
export interface SoundDef {
  readonly id: string
  readonly name: string
  readonly emoji: EmojiName
  readonly durationMs: number
  /** "Keras" sounds are marked and play 6 dB quieter */
  readonly loud?: boolean
}

export const SOUNDS: readonly SoundDef[] = [
  { id: 'clap', name: 'Tepuk tangan', emoji: 'clap', durationMs: 4500 },
  { id: 'drumroll', name: 'Drum roll', emoji: 'drum', durationMs: 3900 },
  { id: 'tada', name: 'Ta-da', emoji: 'party', durationMs: 1200 },
  { id: 'wow', name: 'Wow', emoji: 'wow', durationMs: 3750 },
  { id: 'ding', name: 'Ding', emoji: 'ding', durationMs: 1500 },
  { id: 'horn', name: 'Air horn', emoji: 'horn', durationMs: 1950, loud: true },
  { id: 'rimshot', name: 'Rimshot', emoji: 'rimshot', durationMs: 1850 },
  { id: 'sad', name: 'Sad trombone', emoji: 'sad', durationMs: 3500 },
  { id: 'cricket', name: 'Jangkrik', emoji: 'cricket', durationMs: 3900 },
  { id: 'whoosh', name: 'Whoosh', emoji: 'whoosh', durationMs: 950 },
  { id: 'cheer', name: 'Sorak penonton', emoji: 'cheer', durationMs: 4600 },
  { id: 'levelup', name: 'Level up', emoji: 'levelup', durationMs: 1900 },
]

export const SOUND_BY_ID: Readonly<Record<string, SoundDef>> = Object.fromEntries(SOUNDS.map((s) => [s.id, s]))

const buffers = new Map<string, Promise<AudioBuffer | null>>()

/** Decode one sound once; a file that cannot be decoded only silences itself. */
function load(id: string, ctx: AudioContext): Promise<AudioBuffer | null> {
  let buffer = buffers.get(id)
  if (!buffer) {
    buffer = import('./soundboardData')
      .then(({ SOUNDBOARD_DATA }) => ctx.decodeAudioData(bytesOf(SOUNDBOARD_DATA[id])))
      .catch((error: unknown) => {
        console.warn(`Soundboard sound "${id}" could not be loaded`, error)
        return null
      })
    buffers.set(id, buffer)
  }
  return buffer
}

/** Decode every sound as soon as audio is unlocked, so the first press is not late. */
export function preloadSoundboard() {
  onAudioReady(({ ctx }) => {
    for (const { id } of SOUNDS) void load(id, ctx)
  })
}

/** Play a sound through the soundboard volume group. Loud ones are 6 dB quieter. */
export function playSound(id: string) {
  const audio = getAudio()
  const def = SOUND_BY_ID[id]
  if (!audio || !def) return
  void load(id, audio.ctx).then((buffer) => {
    if (!buffer) return
    const source = audio.ctx.createBufferSource()
    source.buffer = buffer
    const trim = audio.ctx.createGain()
    trim.gain.value = def.loud ? 0.5 : 1
    source.connect(trim).connect(audio.groups.soundboard)
    source.start()
  })
}
