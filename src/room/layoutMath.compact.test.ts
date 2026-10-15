import { describe, expect, it } from 'vitest'
import { GRID_GAP } from './gridLayout'
import { PHONE_PAGE_SIZE, phoneColumns, phoneGridLayout, phonePageCount, phoneShareLayout, phoneSpeakerLayout } from './layoutMath.compact'
import type { Rect } from './layoutMath'

const W = 374
const H = 560
const people = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`)

const inside = (r: Rect) => r.x >= -0.5 && r.y >= -0.5 && r.x + r.w <= W + 0.5 && r.y + r.h <= H + 0.5
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5

function visible(layout: ReturnType<typeof phoneGridLayout>) {
  return Object.entries(layout.rects).filter(([id]) => !layout.hidden.has(id)).map(([, r]) => r)
}

describe('phone paging', () => {
  it('shows six per page', () => {
    expect(phonePageCount(1)).toBe(1)
    expect(phonePageCount(PHONE_PAGE_SIZE)).toBe(1)
    expect(phonePageCount(PHONE_PAGE_SIZE + 1)).toBe(2)
    expect(phonePageCount(12)).toBe(2)
    expect(phonePageCount(13)).toBe(3)
  })

  it('stacks one or two people and uses two columns from three', () => {
    expect([1, 2, 3, 4, 5, 6].map(phoneColumns)).toEqual([1, 1, 2, 2, 2, 2])
  })
})

describe('phoneGridLayout', () => {
  it.each([1, 2, 3, 4, 5, 6])('fits %i people inside the stage without overlap', (n) => {
    const rects = visible(phoneGridLayout(people(n), W, H))
    expect(rects).toHaveLength(n)
    rects.forEach((r) => expect(inside(r)).toBe(true))
    rects.forEach((a, i) => rects.slice(i + 1).forEach((b) => expect(overlaps(a, b)).toBe(false)))
  })

  it('gives a lone person the whole stage', () => {
    expect(phoneGridLayout(['a'], W, H).rects.a).toEqual({ x: 0, y: 0, w: W, h: H })
  })

  it('stretches a short last row across the width', () => {
    const { rects } = phoneGridLayout(people(3), W, H)
    expect(rects.p2.w).toBe(W)
    expect(rects.p0.w).toBeCloseTo((W - GRID_GAP) / 2)
  })

  it('fills the height with the rows it needs', () => {
    const { rects } = phoneGridLayout(people(5), W, H)
    expect(rects.p4.y + rects.p4.h).toBeCloseTo(H)
  })

  it('hides the people on other pages and shows the current one', () => {
    const ids = people(8)
    const first = phoneGridLayout(ids, W, H, 0)
    expect([...first.hidden]).toEqual(['p6', 'p7'])
    const second = phoneGridLayout(ids, W, H, 1)
    expect([...second.hidden]).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5'])
    // the second page holds two people, who stack in one column
    expect(second.rects.p6.w).toBe(W)
    expect(second.rects.p7.y).toBeGreaterThan(second.rects.p6.y)
  })

  it('survives a request for a page that does not exist', () => {
    expect([...phoneGridLayout(people(3), W, H, 9).hidden]).toEqual([])
  })

  it('handles an empty room', () => {
    expect(phoneGridLayout([], W, H).rects).toEqual({})
  })
})

describe('phoneSpeakerLayout', () => {
  it('puts the focused person above a row of the others', () => {
    const ids = people(4)
    const layout = phoneSpeakerLayout(ids, 'p0', W, H, 0)
    const main = layout.rects.p0
    expect(main.w).toBe(W)
    const strip = ['p1', 'p2', 'p3'].map((id) => layout.rects[id])
    strip.forEach((r) => {
      expect(r.y).toBeGreaterThan(main.y + main.h)
      expect(inside(r)).toBe(true)
    })
    expect(new Set(strip.map((r) => r.y)).size).toBe(1)
    expect(layout.pager).toBeNull()
  })

  it('gives a lone person the stage', () => {
    expect(phoneSpeakerLayout(['a'], 'a', W, H, 0).rects.a).toEqual({ x: 0, y: 0, w: W, h: H })
  })

  it('pages the strip after three and reserves room for the pager', () => {
    const layout = phoneSpeakerLayout(people(8), 'p0', W, H, 0)
    expect(layout.pager?.pages).toBe(3)
    expect(layout.hidden.has('p1')).toBe(false)
    expect(layout.hidden.has('p4')).toBe(true)
    const pager = layout.pager!
    expect(pager.y + 28).toBeLessThanOrEqual(H + 0.5)
  })

  it('centres a short strip page', () => {
    const { rects } = phoneSpeakerLayout(people(3), 'p0', W, H, 0)
    const left = rects.p1.x
    const right = W - (rects.p2.x + rects.p2.w)
    expect(left).toBeCloseTo(right)
  })
})

describe('phoneShareLayout', () => {
  it('puts the shared screen at 16:9 across the top and the people below it', () => {
    const layout = phoneShareLayout(people(4), 'p2', W, H, 0)
    const frame = layout.frame!
    expect(frame.w).toBe(W)
    expect(frame.h).toBe(Math.round(W / (16 / 9)))
    Object.values(layout.rects).forEach((r) => {
      expect(r.y).toBeGreaterThanOrEqual(frame.y + frame.h)
      expect(inside(r)).toBe(true)
    })
    // centred: the same space above the frame as below the strip (to within a pixel)
    const strip = Object.values(layout.rects)[0]
    const bottom = layout.pager ? layout.pager.y + 28 : strip.y + strip.h
    expect(Math.abs(frame.y - (H - bottom))).toBeLessThanOrEqual(1)
  })

  it('lists the presenter first', () => {
    const layout = phoneShareLayout(people(4), 'p2', W, H, 0)
    expect(layout.rects.p2.x).toBeLessThan(layout.rects.p0.x)
  })

  it('pages the row after three people', () => {
    const layout = phoneShareLayout(people(7), 'p0', W, H, 1)
    expect(layout.pager?.pages).toBe(3)
    expect(layout.hidden.has('p0')).toBe(true)
    expect(layout.hidden.has('p3')).toBe(false)
  })

  it('keeps the frame on a short stage', () => {
    const layout = phoneShareLayout(people(3), 'p0', 374, 260, 0)
    expect(layout.frame!.h).toBeLessThanOrEqual(260)
  })
})

describe('swipeDirection', () => {
  it('reads a long, mostly horizontal drag as a swipe', async () => {
    const { swipeDirection } = await import('./useSwipe')
    expect(swipeDirection(-120, 10)).toBe(1)
    expect(swipeDirection(120, -10)).toBe(-1)
  })

  it('ignores taps, short drags and diagonal or vertical movement', async () => {
    const { swipeDirection } = await import('./useSwipe')
    expect(swipeDirection(10, 0)).toBe(0)
    expect(swipeDirection(-40, 0)).toBe(0)
    expect(swipeDirection(-100, 90)).toBe(0)
    expect(swipeDirection(0, 200)).toBe(0)
  })
})

describe('self-view PiP', () => {
  it('parks the small tile in each corner with a margin', async () => {
    const { pipRect, PIP_W, PIP_H } = await import('./layoutMath.compact')
    const br = pipRect('br', W, H)
    expect(br).toMatchObject({ w: PIP_W, h: PIP_H })
    expect(br.x + br.w).toBe(W - 10)
    expect(br.y + br.h).toBe(H - 10)
    expect(pipRect('tl', W, H)).toMatchObject({ x: 10, y: 10 })
    expect(pipRect('tr', W, H).x + PIP_W).toBe(W - 10)
    expect(pipRect('bl', W, H).y + PIP_H).toBe(H - 10)
  })

  it('never makes the PiP larger than a tiny stage', async () => {
    const { pipRect } = await import('./layoutMath.compact')
    const r = pipRect('br', 90, 100)
    expect(r.x).toBeGreaterThanOrEqual(0)
    expect(r.x + r.w).toBeLessThanOrEqual(90)
    expect(r.y + r.h).toBeLessThanOrEqual(100)
  })

  it('settles a drop in the quadrant of its centre', async () => {
    const { nearestPipCorner } = await import('./layoutMath.compact')
    expect(nearestPipCorner(50, 60, W, H)).toBe('tl')
    expect(nearestPipCorner(W - 40, 60, W, H)).toBe('tr')
    expect(nearestPipCorner(40, H - 50, W, H)).toBe('bl')
    expect(nearestPipCorner(W - 40, H - 50, W, H)).toBe('br')
  })

  it('gives the other person the whole stage and floats you over them', () => {
    const layout = phoneGridLayout(['me', 'them'], W, H, 0, { selfId: 'me', corner: 'tr' })
    expect(layout.rects.them).toEqual({ x: 0, y: 0, w: W, h: H })
    expect(layout.rects.me.x + layout.rects.me.w).toBe(W - 10)
    expect(layout.rects.me.y).toBe(10)
    expect(layout.hidden.size).toBe(0)
  })

  it('only applies to exactly two people that include you', () => {
    expect(phoneGridLayout(['a', 'b'], W, H, 0, { selfId: 'me', corner: 'br' }).rects.a.h).toBeLessThan(H)
    expect(phoneGridLayout(['me', 'a', 'b'], W, H, 0, { selfId: 'me', corner: 'br' }).rects.me.w).not.toBe(104)
    expect(phoneGridLayout(['me'], W, H, 0, { selfId: 'me', corner: 'br' }).rects.me.w).toBe(W)
  })
})
