import { getAudio, onAudioReady } from './audioEngine'

/** Room sound effects, one per event. The audio itself lives in `soundData.ts`, embedded in the bundle. */
export type SoundCue =
  | 'micMute'
  | 'micUnmute'
  | 'raiseHand'
  | 'shareStart'
  | 'shareStop'
  | 'incomingChat'
  | 'enterRoom'
  | 'leaveRoom'
  | 'connectionUnstable'

const DEFAULT_GAP_MS = 1500
/** Per-cue minimum spacing; bursts (e.g. resizing the room from 4 to 12) collapse into one sound. */
const MIN_GAP_MS: Readonly<Partial<Record<SoundCue, number>>> = {
  micMute: 150,
  micUnmute: 150,
  connectionUnstable: 30_000,
}

const buffers = new Map<SoundCue, AudioBuffer>()
const lastPlayedAt = new Map<SoundCue, number>()
let preloadStarted = false

/** data:audio/mpeg;base64,... -> raw bytes, without a network request. */
function bytesOf(dataUri: string): ArrayBuffer {
  const binary = atob(dataUri.slice(dataUri.indexOf(',') + 1))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

/** Decode every cue as soon as audio is unlocked by the first user gesture. */
export function preloadSoundCues() {
  if (preloadStarted) return
  preloadStarted = true
  onAudioReady(({ ctx }) => {
    void import('./soundData')
      .then(async ({ SOUND_DATA }) => {
        for (const cue of Object.keys(SOUND_DATA) as SoundCue[]) {
          try {
            buffers.set(cue, await ctx.decodeAudioData(bytesOf(SOUND_DATA[cue])))
          } catch (error: unknown) {
            // An undecodable file only silences its own cue
            console.warn(`Sound "${cue}" could not be decoded`, error)
          }
        }
      })
      .catch((error: unknown) => console.warn('Sound effects could not be loaded', error))
  })
}

export function playCue(cue: SoundCue, now: number = performance.now()) {
  const audio = getAudio()
  const buffer = buffers.get(cue)
  if (!audio || !buffer) return
  const last = lastPlayedAt.get(cue)
  if (last !== undefined && now - last < (MIN_GAP_MS[cue] ?? DEFAULT_GAP_MS)) return
  lastPlayedAt.set(cue, now)
  const source = audio.ctx.createBufferSource()
  source.buffer = buffer
  source.connect(audio.groups.notify)
  source.start()
}
