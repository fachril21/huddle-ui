/** Level above which the mic counts as hearing a voice. */
export const SPEAKING_THRESHOLD = 0.12
/** RMS that maps to a full bar; ordinary speech sits well below 1.0 so it is boosted. */
const FULL_SCALE_RMS = 0.35

/** Root-mean-square of an unsigned-byte time-domain buffer (AnalyserNode.getByteTimeDomainData), 0..1. */
export function rmsFromBytes(samples: ArrayLike<number>): number {
  if (samples.length === 0) return 0
  let sum = 0
  for (let i = 0; i < samples.length; i++) {
    const v = (samples[i] - 128) / 128
    sum += v * v
  }
  return Math.sqrt(sum / samples.length)
}

/** RMS to a 0..1 meter value. */
export function levelFromRms(rms: number): number {
  return Math.min(1, Math.max(0, rms / FULL_SCALE_RMS))
}

/** Fast attack, slow release, so the bar jumps on speech and falls gently. */
export function smoothLevel(previous: number, next: number, attack = 0.6, release = 0.12): number {
  const k = next > previous ? attack : release
  return previous + (next - previous) * k
}

/** Bars lit out of `count` for a 0..1 level. Any audible signal lights at least one bar. */
export function litBars(level: number, count: number): number {
  if (level <= 0.01) return 0
  return Math.min(count, Math.max(1, Math.ceil(level * count)))
}
