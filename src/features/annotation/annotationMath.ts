import type { Stroke } from '../../state/types'

export const MAX_STROKES = 200
/** Flat array length cap per stroke (600 points) */
export const MAX_COORDS = 1200
/** Smallest movement, as a fraction of the screen, that adds a point */
export const MIN_STEP = 0.0025
export const FADE_OUT_MS = 600
/** How long an author name tag lingers after a stroke ends */
export const LABEL_MS = 2400

export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/** Add a point to an in-progress stroke buffer. Returns false when it is too close to the last point or the cap is hit. */
export function appendPoint(coords: number[], x: number, y: number): boolean {
  if (coords.length >= MAX_COORDS) return false
  const n = coords.length
  if (n >= 2 && Math.hypot(x - coords[n - 2], y - coords[n - 1]) < MIN_STEP) return false
  coords.push(clamp01(x), clamp01(y))
  return true
}

export function strokeEndsAt(stroke: Pick<Stroke, 'startedAt' | 'durationMs'>): number {
  return stroke.startedAt + stroke.durationMs
}

type Lifetime = Pick<Stroke, 'startedAt' | 'durationMs' | 'fadeAfterMs'>

/** 1 while the stroke is solid, fading to 0 over FADE_OUT_MS once its lifetime is up. */
export function strokeAlpha(stroke: Lifetime, now: number): number {
  if (stroke.fadeAfterMs === null) return 1
  const fadeStart = strokeEndsAt(stroke) + stroke.fadeAfterMs
  if (now <= fadeStart) return 1
  return Math.max(0, 1 - (now - fadeStart) / FADE_OUT_MS)
}

export function isExpired(stroke: Lifetime, now: number): boolean {
  return stroke.fadeAfterMs !== null && strokeAlpha(stroke, now) === 0
}

/** Number of x,y pairs to draw right now; strokes from other people are revealed over their duration. */
export function visiblePairs(stroke: Pick<Stroke, 'points' | 'startedAt' | 'durationMs'>, now: number): number {
  const pairs = Math.floor(stroke.points.length / 2)
  if (stroke.durationMs <= 0) return pairs
  const progress = clamp01((now - stroke.startedAt) / stroke.durationMs)
  return Math.max(1, Math.ceil(pairs * progress))
}

/** Distance from a point to the segment a-b, with x scaled by `aspect` so the hit area is round on screen. */
function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number, aspect: number): number {
  const x = px * aspect
  const x1 = ax * aspect
  const x2 = bx * aspect
  const dx = x2 - x1
  const dy = by - ay
  const lengthSq = dx * dx + dy * dy
  const t = lengthSq === 0 ? 0 : clamp01(((x - x1) * dx + (py - ay) * dy) / lengthSq)
  return Math.hypot(x - (x1 + t * dx), py - (ay + t * dy))
}

/** Whether the eraser at (x, y) touches the stroke. `radius` is a fraction of the screen height. */
export function strokeHit(stroke: Pick<Stroke, 'points'>, x: number, y: number, radius: number, aspect: number): boolean {
  const p = stroke.points
  if (p.length === 2) return Math.hypot((x - p[0]) * aspect, y - p[1]) <= radius
  for (let i = 0; i + 3 < p.length; i += 2) {
    if (distanceToSegment(x, y, p[i], p[i + 1], p[i + 2], p[i + 3], aspect) <= radius) return true
  }
  return false
}
