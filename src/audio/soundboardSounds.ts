import { getAudio } from './audioEngine'
import type { EmojiName } from '../emoji/registry'

/**
 * The 12 built-in soundboard sounds (PRD 11.2), all synthesized with Web Audio (no recordings, no licences).
 * Every sound is at most 5 seconds (Design.md 12.3).
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
  { id: 'clap', name: 'Tepuk tangan', emoji: 'clap', durationMs: 1800 },
  { id: 'drumroll', name: 'Drum roll', emoji: 'drum', durationMs: 2400 },
  { id: 'tada', name: 'Ta-da', emoji: 'party', durationMs: 1700 },
  { id: 'wow', name: 'Wow', emoji: 'wow', durationMs: 1000 },
  { id: 'ding', name: 'Ding', emoji: 'ding', durationMs: 1300 },
  { id: 'horn', name: 'Air horn', emoji: 'horn', durationMs: 1700, loud: true },
  { id: 'rimshot', name: 'Rimshot', emoji: 'rimshot', durationMs: 1500 },
  { id: 'sad', name: 'Sad trombone', emoji: 'sad', durationMs: 2200 },
  { id: 'cricket', name: 'Jangkrik', emoji: 'cricket', durationMs: 2400 },
  { id: 'whoosh', name: 'Whoosh', emoji: 'whoosh', durationMs: 1200 },
  { id: 'cheer', name: 'Sorak penonton', emoji: 'cheer', durationMs: 2600 },
  { id: 'levelup', name: 'Level up', emoji: 'levelup', durationMs: 1100 },
]

export const SOUND_BY_ID: Readonly<Record<string, SoundDef>> = Object.fromEntries(SOUNDS.map((s) => [s.id, s]))

type Ctx = AudioContext
type Dest = AudioNode

interface ToneOpts {
  freq: number
  at?: number
  dur: number
  type?: OscillatorType
  gain?: number
  slideTo?: number
  attack?: number
  detune?: number
  lowpass?: number
  vibrato?: number
}

function tone(ctx: Ctx, dest: Dest, o: ToneOpts) {
  const t = ctx.currentTime + (o.at ?? 0)
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(o.freq, t)
  if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t + o.dur)
  if (o.detune) osc.detune.value = o.detune
  const peak = o.gain ?? 0.2
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(peak, t + (o.attack ?? 0.012))
  gain.gain.exponentialRampToValueAtTime(0.0001, t + o.dur)
  let chain: AudioNode = osc
  if (o.lowpass) {
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = o.lowpass
    osc.connect(lp)
    chain = lp
  }
  if (o.vibrato) {
    const lfo = ctx.createOscillator()
    const depth = ctx.createGain()
    lfo.frequency.value = 6
    depth.gain.value = o.vibrato
    lfo.connect(depth).connect(osc.frequency)
    lfo.start(t)
    lfo.stop(t + o.dur + 0.05)
  }
  chain.connect(gain).connect(dest)
  osc.start(t)
  osc.stop(t + o.dur + 0.05)
}

interface NoiseOpts {
  at?: number
  dur: number
  type?: BiquadFilterType
  freq: number
  freqTo?: number
  q?: number
  gain?: number
  attack?: number
}

function noise(ctx: Ctx, dest: Dest, o: NoiseOpts) {
  const t = ctx.currentTime + (o.at ?? 0)
  const length = Math.max(1, Math.floor(ctx.sampleRate * o.dur))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = o.type ?? 'bandpass'
  filter.frequency.setValueAtTime(o.freq, t)
  if (o.freqTo) filter.frequency.exponentialRampToValueAtTime(o.freqTo, t + o.dur)
  filter.Q.value = o.q ?? 1
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(o.gain ?? 0.3, t + (o.attack ?? 0.004))
  gain.gain.exponentialRampToValueAtTime(0.0001, t + o.dur)
  src.connect(filter).connect(gain).connect(dest)
  src.start(t)
  src.stop(t + o.dur + 0.02)
}

const PLAYERS: Record<string, (ctx: Ctx, d: Dest) => void> = {
  clap(ctx, d) {
    for (let i = 0; i < 16; i++) {
      const at = Math.random() * 1.4 * (0.4 + i / 24)
      noise(ctx, d, { at, dur: 0.07, freq: 1500 + Math.random() * 1200, q: 0.8, gain: 0.5 * (1 - at / 2) })
    }
  },
  drumroll(ctx, d) {
    for (let i = 0; i < 44; i++) noise(ctx, d, { at: i * 0.045, dur: 0.05, freq: 380, q: 0.7, gain: 0.12 + (i / 44) * 0.3 })
    tone(ctx, d, { freq: 120, at: 2.05, dur: 0.3, slideTo: 50, gain: 0.5 })
    noise(ctx, d, { at: 2.05, dur: 0.3, type: 'highpass', freq: 1200, gain: 0.35 })
  },
  tada(ctx, d) {
    ;[523, 659, 784].forEach((f, i) => tone(ctx, d, { freq: f, at: i * 0.13, dur: 0.22, type: 'sawtooth', gain: 0.13, lowpass: 2400 }))
    ;[1047, 784, 659].forEach((f) => tone(ctx, d, { freq: f, at: 0.45, dur: 1.1, type: 'sawtooth', gain: 0.1, lowpass: 2600, attack: 0.02 }))
  },
  wow(ctx, d) {
    tone(ctx, d, { freq: 280, dur: 0.5, slideTo: 640, gain: 0.22, type: 'triangle', lowpass: 1800 })
    tone(ctx, d, { freq: 640, at: 0.45, dur: 0.5, slideTo: 250, gain: 0.2, type: 'triangle', lowpass: 1800 })
  },
  ding(ctx, d) {
    tone(ctx, d, { freq: 1568, dur: 1.2, gain: 0.2 })
    tone(ctx, d, { freq: 3136, dur: 0.6, gain: 0.07 })
  },
  horn(ctx, d) {
    ;[440, 554, 659].forEach((f, i) => tone(ctx, d, { freq: f, dur: 1.6, slideTo: f * 0.94, type: 'sawtooth', gain: 0.18, detune: i * 7, lowpass: 2600, attack: 0.03 }))
  },
  rimshot(ctx, d) {
    for (const at of [0, 0.2]) {
      tone(ctx, d, { freq: 190, at, dur: 0.1, slideTo: 130, gain: 0.35, type: 'triangle' })
      noise(ctx, d, { at, dur: 0.12, freq: 2400, q: 0.6, gain: 0.35 })
    }
    noise(ctx, d, { at: 0.48, dur: 1.0, type: 'highpass', freq: 5200, gain: 0.2, attack: 0.01 })
  },
  sad(ctx, d) {
    ;[[233, 0], [220, 0.5], [208, 1.0]].forEach(([f, at]) => tone(ctx, d, { freq: f, at, dur: 0.46, type: 'sawtooth', gain: 0.16, lowpass: 900 }))
    tone(ctx, d, { freq: 196, at: 1.5, dur: 0.65, slideTo: 150, type: 'sawtooth', gain: 0.16, lowpass: 900, vibrato: 4 })
  },
  cricket(ctx, d) {
    for (let g = 0; g < 3; g++)
      for (let i = 0; i < 4; i++) tone(ctx, d, { freq: 4300, at: g * 0.8 + i * 0.1, dur: 0.07, type: 'square', gain: 0.08, lowpass: 5200, attack: 0.004 })
  },
  whoosh(ctx, d) {
    noise(ctx, d, { dur: 1.1, freq: 350, freqTo: 3200, q: 1.4, gain: 0.35, attack: 0.5 })
  },
  cheer(ctx, d) {
    for (const f of [700, 1250, 2700]) noise(ctx, d, { dur: 2.5, freq: f, q: 1.2, gain: 0.16, attack: 0.5 })
    for (let i = 0; i < 10; i++) noise(ctx, d, { at: 0.2 + i * 0.2, dur: 0.1, freq: 1900, q: 0.8, gain: 0.12 })
  },
  levelup(ctx, d) {
    ;[523, 659, 784, 1047, 1319].forEach((f, i) => tone(ctx, d, { freq: f, at: i * 0.09, dur: 0.18, type: 'square', gain: 0.12, lowpass: 3200 }))
    tone(ctx, d, { freq: 2093, at: 0.45, dur: 0.5, type: 'triangle', gain: 0.1 })
  },
}

/** Schedule a sound on any context/destination (also used to render offline for checks). Loud ones are 6 dB quieter. */
export function renderSound(id: string, ctx: BaseAudioContext, destination: AudioNode) {
  const def = SOUND_BY_ID[id]
  const play = PLAYERS[id]
  if (!play || !def) return
  const trim = ctx.createGain()
  trim.gain.value = def.loud ? 0.5 : 1
  trim.connect(destination)
  play(ctx as Ctx, trim)
}

/** Play a sound through the soundboard volume group. */
export function playSound(id: string) {
  const audio = getAudio()
  if (audio) renderSound(id, audio.ctx, audio.groups.soundboard)
}
