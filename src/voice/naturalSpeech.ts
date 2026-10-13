/** Generates a speech-like envelope 0..1: phrases with syllable modulation, short pauses, occasional bursts. */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PHRASE_MS: readonly [number, number] = [1400, 3600]
const PAUSE_MS: readonly [number, number] = [450, 1300]
/** Level while "pausing": well under the speaking gate so the tile really goes quiet. */
const PAUSE_FLOOR = 0.03
const BURST_CHANCE = 0.12

export class NaturalSpeech {
  private readonly rand: () => number
  private speaking = true
  private until = 0
  private phrasePhase = 0
  private syllableHz = 4.5
  private phraseAmp = 0.85

  constructor(seed: number) {
    this.rand = mulberry32(seed)
  }

  /** Envelope at time nowMs. Multiply by the user-chosen energy. */
  step(nowMs: number): number {
    if (this.until === 0) this.beginPhrase(nowMs)
    if (nowMs >= this.until) {
      if (this.speaking) this.beginPause(nowMs)
      else this.beginPhrase(nowMs)
    }
    if (!this.speaking) return PAUSE_FLOOR

    const t = nowMs / 1000
    const syllable = 0.5 + 0.5 * Math.sin(2 * Math.PI * this.syllableHz * t + this.phrasePhase)
    const shaped = 0.62 + 0.38 * Math.pow(syllable, 1.2)
    return Math.min(1, this.phraseAmp * shaped)
  }

  private beginPhrase(nowMs: number) {
    this.speaking = true
    this.until = nowMs + this.between(PHRASE_MS)
    this.phrasePhase = this.rand() * Math.PI * 2
    this.syllableHz = 3.4 + this.rand() * 2
    const burst = this.rand() < BURST_CHANCE
    this.phraseAmp = burst ? 1 : 0.68 + this.rand() * 0.28
  }

  private beginPause(nowMs: number) {
    this.speaking = false
    this.until = nowMs + this.between(PAUSE_MS)
  }

  private between([min, max]: readonly [number, number]): number {
    return min + this.rand() * (max - min)
  }
}

export function seedFromId(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  return h >>> 0
}
