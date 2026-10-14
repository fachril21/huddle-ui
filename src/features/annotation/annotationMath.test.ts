import { describe, expect, it } from 'vitest'
import { appendPoint, FADE_OUT_MS, isExpired, MAX_COORDS, strokeAlpha, strokeHit, visiblePairs } from './annotationMath'

describe('appendPoint', () => {
  it('adds a point and clamps it to the screen', () => {
    const coords: number[] = []
    expect(appendPoint(coords, 1.4, -0.2)).toBe(true)
    expect(coords).toEqual([1, 0])
  })

  it('skips points that barely moved', () => {
    const coords = [0.5, 0.5]
    expect(appendPoint(coords, 0.5005, 0.5)).toBe(false)
    expect(appendPoint(coords, 0.6, 0.5)).toBe(true)
  })

  it('stops growing at the cap', () => {
    const coords = Array.from({ length: MAX_COORDS }, (_, i) => i / MAX_COORDS)
    expect(appendPoint(coords, 0.9, 0.9)).toBe(false)
    expect(coords).toHaveLength(MAX_COORDS)
  })
})

describe('strokeAlpha and isExpired', () => {
  const fading = { startedAt: 1000, durationMs: 500, fadeAfterMs: 2000 }

  it('stays solid until its lifetime is over, then fades out', () => {
    expect(strokeAlpha(fading, 3400)).toBe(1)
    expect(strokeAlpha(fading, 3500 + FADE_OUT_MS / 2)).toBeCloseTo(0.5)
    expect(strokeAlpha(fading, 3500 + FADE_OUT_MS)).toBe(0)
  })

  it('never fades a persistent stroke', () => {
    const solid = { startedAt: 0, durationMs: 0, fadeAfterMs: null }
    expect(strokeAlpha(solid, 9_999_999)).toBe(1)
    expect(isExpired(solid, 9_999_999)).toBe(false)
  })

  it('expires a fading stroke once fully faded', () => {
    expect(isExpired(fading, 3500)).toBe(false)
    expect(isExpired(fading, 3500 + FADE_OUT_MS)).toBe(true)
  })
})

describe('visiblePairs', () => {
  const stroke = { points: [0, 0, 0.1, 0, 0.2, 0, 0.3, 0], startedAt: 100, durationMs: 400 }

  it('reveals a stroke progressively', () => {
    expect(visiblePairs(stroke, 100)).toBe(1)
    expect(visiblePairs(stroke, 300)).toBe(2)
    expect(visiblePairs(stroke, 500)).toBe(4)
  })

  it('shows an instant stroke in full', () => {
    expect(visiblePairs({ ...stroke, durationMs: 0 }, 100)).toBe(4)
  })
})

describe('strokeHit', () => {
  const line = { points: [0.2, 0.5, 0.8, 0.5] }

  it('hits near the line and misses far from it', () => {
    expect(strokeHit(line, 0.5, 0.52, 0.04, 1.78)).toBe(true)
    expect(strokeHit(line, 0.5, 0.7, 0.04, 1.78)).toBe(false)
  })

  it('treats a single point as a dot', () => {
    expect(strokeHit({ points: [0.5, 0.5] }, 0.5, 0.51, 0.03, 1.78)).toBe(true)
    expect(strokeHit({ points: [0.5, 0.5] }, 0.9, 0.9, 0.03, 1.78)).toBe(false)
  })
})
