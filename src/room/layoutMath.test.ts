import { describe, expect, it } from 'vitest'
import { gridLayout, speakerLayout, spotlightLayout } from './layoutMath'
import type { Rect, StageLayout } from './layoutMath'

const W = 1400
const H = 800
const people = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`)

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5
}

function visibleRects(layout: StageLayout): Rect[] {
  return Object.entries(layout.rects)
    .filter(([id]) => !layout.hidden.has(id))
    .map(([, rect]) => rect)
}

function expectClean(layout: StageLayout) {
  const rects = visibleRects(layout)
  for (const r of rects) {
    expect(r.x).toBeGreaterThanOrEqual(-0.5)
    expect(r.y).toBeGreaterThanOrEqual(-0.5)
    expect(r.x + r.w).toBeLessThanOrEqual(W + 0.5)
    expect(r.y + r.h).toBeLessThanOrEqual(H + 0.5)
  }
  rects.forEach((a, i) => rects.slice(i + 1).forEach((b) => expect(overlaps(a, b)).toBe(false)))
}

describe('speakerLayout', () => {
  it('gives the focused person the largest tile and keeps everything inside without overlap', () => {
    const layout = speakerLayout(people(8), 'p3', W, H, 0)
    expectClean(layout)
    const focus = layout.rects.p3
    for (const [id, rect] of Object.entries(layout.rects)) if (id !== 'p3') expect(focus.w * focus.h).toBeGreaterThan(rect.w * rect.h)
    expect(focus.w / focus.h).toBeCloseTo(16 / 9, 1)
  })

  it('places the filmstrip below the focused tile', () => {
    const layout = speakerLayout(people(5), 'p0', W, H, 0)
    expect(layout.rects.p1.y).toBeGreaterThanOrEqual(layout.rects.p0.y + layout.rects.p0.h)
  })

  it('pages the filmstrip and hides tiles on other pages', () => {
    const layout = speakerLayout(people(12), 'p0', W, H, 0)
    expect(layout.pager?.pages).toBe(2)
    expect(layout.hidden.size).toBe(5)
    expectClean(layout)
    const second = speakerLayout(people(12), 'p0', W, H, 1)
    expect(second.hidden.has('p1')).toBe(true)
    expect(second.hidden.has('p11')).toBe(false)
  })

  it('shows a lone participant at full size', () => {
    const layout = speakerLayout(['solo'], 'solo', W, H, 0)
    expect(layout.pager).toBeNull()
    expect(layout.rects.solo.w).toBeGreaterThan(600)
  })
})

describe('spotlightLayout', () => {
  it('puts the focused tile on the left and a vertical strip on the right', () => {
    const layout = spotlightLayout(people(5), 'p2', W, H, 0)
    expectClean(layout)
    expect(layout.rects.p2.x + layout.rects.p2.w).toBeLessThan(layout.rects.p0.x)
    expect(layout.rects.p0.x).toBe(layout.rects.p1.x)
    expect(layout.rects.p1.y).toBeGreaterThan(layout.rects.p0.y)
  })

  it('shows 4 strip tiles per page and a pager beyond that', () => {
    const layout = spotlightLayout(people(10), 'p0', W, H, 0)
    expect(layout.pager?.pages).toBe(3)
    expect(layout.hidden.size).toBe(5)
    expectClean(layout)
  })
})

describe('gridLayout stays valid for the gallery mode', () => {
  it('lays out 8 people without overlap', () => {
    expectClean(gridLayout(people(8), W, H))
  })
})
