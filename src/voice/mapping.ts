/** Level -> visual mapping, Design.md 7.3. L is the smoothed level in 0..1, m the visibility multiplier (hold/fade). */

export const COMET_PERIOD_SLOW_S = 2.6
export const COMET_PERIOD_FAST_S = 1.1

export interface VisualVars {
  readonly lvl: number
  readonly auroraOpacity: number
  readonly blobScale: number
  readonly saturate: number
  readonly neonOpacity: number
  readonly glowInOpacity: number
  readonly glowOutOpacity: number
}

export interface AnimationRates {
  /** playbackRate for the comet, relative to its 2.6s base period */
  readonly comet: number
  /** playbackRate for blob / curtain motion, 1x..2.5x */
  readonly blob: number
}

export function mapLevel(level: number, visibility: number): VisualVars {
  const L = clamp01(level)
  const neon = (0.25 + 0.75 * L) * visibility
  return {
    lvl: L,
    auroraOpacity: (0.12 + 0.88 * Math.pow(L, 0.8)) * visibility,
    blobScale: 1 + 0.6 * L,
    saturate: 1 + 0.4 * L,
    neonOpacity: neon,
    glowInOpacity: (0.1 + 0.4 * L) * visibility,
    glowOutOpacity: neon,
  }
}

export function mapRates(level: number): AnimationRates {
  const L = clamp01(level)
  const period = COMET_PERIOD_SLOW_S - (COMET_PERIOD_SLOW_S - COMET_PERIOD_FAST_S) * L
  return { comet: COMET_PERIOD_SLOW_S / period, blob: 1 + 1.5 * L }
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}
