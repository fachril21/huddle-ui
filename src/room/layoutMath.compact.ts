import { GRID_GAP } from './gridLayout'
import type { Rect, StageLayout } from './layoutMath'

/**
 * Layouts for a phone held upright. The stage is tall and narrow, so tiles are not forced to 16:9: they take the
 * full width and share the height, and the camera picture is cropped to fit (object-fit: cover) like Zoom and Meet.
 */

/** Six tiles per page: nine on a 390px wide screen would be thumbnails. */
export const PHONE_PAGE_SIZE = 6
const STRIP_SLOTS = 3
const STRIP_RATIO = 1.2 // strip tiles are a little taller than wide
const STRIP_MIN_H = 88
const PAGER_H = 28
const PAGER_GAP = 8
const PAGER_W = 120
const SHARE_RATIO = 16 / 9

export function phonePageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PHONE_PAGE_SIZE))
}

/** One person or two stack in a single column; from three up, two columns. */
export function phoneColumns(count: number): number {
  return count <= 2 ? 1 : 2
}

function layoutPage(ids: readonly string[], W: number, H: number, into: Record<string, Rect>) {
  const cols = phoneColumns(ids.length)
  const rows = Math.ceil(ids.length / cols)
  const tileH = Math.max(0, (H - GRID_GAP * (rows - 1)) / rows)
  ids.forEach((id, i) => {
    const row = Math.floor(i / cols)
    const inRow = Math.min(cols, ids.length - row * cols)
    // a short last row stretches to the full width instead of leaving a hole
    const tileW = (W - GRID_GAP * (inRow - 1)) / inRow
    into[id] = { x: (i % cols) * (tileW + GRID_GAP), y: row * (tileH + GRID_GAP), w: tileW, h: tileH }
  })
}

export type PipCorner = 'tl' | 'tr' | 'bl' | 'br'

export const PIP_W = 104
export const PIP_H = 140
const PIP_MARGIN = 10

/** The floating self-view for a one-to-one call, parked in a corner of the stage. */
export function pipRect(corner: PipCorner, W: number, H: number): Rect {
  const w = Math.min(PIP_W, Math.max(0, W - PIP_MARGIN * 2))
  const h = Math.min(PIP_H, Math.max(0, H - PIP_MARGIN * 2))
  return {
    x: corner.endsWith('l') ? PIP_MARGIN : Math.max(0, W - w - PIP_MARGIN),
    y: corner.startsWith('t') ? PIP_MARGIN : Math.max(0, H - h - PIP_MARGIN),
    w,
    h,
  }
}

/** Where a dropped self-view settles: the corner of the quadrant its centre is in. */
export function nearestPipCorner(centerX: number, centerY: number, W: number, H: number): PipCorner {
  return `${centerY < H / 2 ? 't' : 'b'}${centerX < W / 2 ? 'l' : 'r'}` as PipCorner
}

export interface PipSetting {
  readonly selfId: string
  readonly corner: PipCorner
}

/** True when the call is just you and one other person, so the other fills the stage and you float over it. */
export function usesPip(ids: readonly string[], pip: PipSetting | undefined): pip is PipSetting {
  return pip !== undefined && ids.length === 2 && ids.includes(pip.selfId)
}

export function phoneGridLayout(ids: readonly string[], W: number, H: number, page = 0, pip?: PipSetting): StageLayout {
  if (usesPip(ids, pip)) {
    const other = ids.find((id) => id !== pip.selfId) as string
    return { rects: { [other]: { x: 0, y: 0, w: W, h: H }, [pip.selfId]: pipRect(pip.corner, W, H) }, hidden: new Set(), frame: null, pager: null }
  }
  const pages = phonePageCount(ids.length)
  const current = Math.min(page, pages - 1)
  const rects: Record<string, Rect> = {}
  const hidden = new Set<string>()
  for (let p = 0; p < pages; p++) {
    const slice = ids.slice(p * PHONE_PAGE_SIZE, (p + 1) * PHONE_PAGE_SIZE)
    layoutPage(slice, W, H, rects)
    if (p !== current) slice.forEach((id) => hidden.add(id))
  }
  return { rects, hidden, frame: null, pager: null }
}

function stripTile(W: number): { w: number; h: number } {
  const w = Math.max(0, (W - GRID_GAP * (STRIP_SLOTS - 1)) / STRIP_SLOTS)
  return { w, h: Math.max(STRIP_MIN_H, Math.round(w * STRIP_RATIO)) }
}

/** Lay `ordered` out in a row of three slots starting at y; other pages are parked in the same slots, hidden. */
function layoutStrip(ordered: readonly string[], W: number, y: number, h: number, page: number, rects: Record<string, Rect>, hidden: Set<string>) {
  const { w } = stripTile(W)
  const pages = Math.ceil(ordered.length / STRIP_SLOTS)
  const current = Math.min(page, pages - 1)
  ordered.forEach((id, i) => {
    const pageIndex = Math.floor(i / STRIP_SLOTS)
    const onPage = Math.min(STRIP_SLOTS, ordered.length - pageIndex * STRIP_SLOTS)
    // a short page is centred
    const x0 = (W - (onPage * w + (onPage - 1) * GRID_GAP)) / 2
    rects[id] = { x: x0 + (i % STRIP_SLOTS) * (w + GRID_GAP), y, w, h }
    if (pageIndex !== current) hidden.add(id)
  })
  return pages
}

/** Pembicara and Sorotan on a phone: the focused person large on top, everyone else in a row of three below. */
export function phoneSpeakerLayout(ids: readonly string[], focusId: string, W: number, H: number, page: number): StageLayout {
  const others = ids.filter((id) => id !== focusId)
  const rects: Record<string, Rect> = {}
  const hidden = new Set<string>()
  if (!others.length) {
    layoutPage([focusId], W, H, rects)
    return { rects, hidden, frame: null, pager: null }
  }
  const pages = Math.ceil(others.length / STRIP_SLOTS)
  const reserved = pages > 1 ? PAGER_GAP + PAGER_H : 0
  const stripH = stripTile(W).h
  const mainH = Math.max(0, H - stripH - reserved - GRID_GAP)
  rects[focusId] = { x: 0, y: 0, w: W, h: mainH }
  const y = mainH + GRID_GAP
  layoutStrip(others, W, y, stripH, page, rects, hidden)
  const pager = pages > 1 ? { x: (W - PAGER_W) / 2, y: y + stripH + PAGER_GAP, w: PAGER_W, pages } : null
  return { rects, hidden, frame: null, pager }
}

/** Share screen on a phone: the shared screen at 16:9 across the top, the people in a row of three below it. */
export function phoneShareLayout(ids: readonly string[], presenterId: string, W: number, H: number, page: number): StageLayout {
  const ordered = [presenterId, ...ids.filter((id) => id !== presenterId)]
  const rects: Record<string, Rect> = {}
  const hidden = new Set<string>()
  const pages = Math.ceil(ordered.length / STRIP_SLOTS)
  const reserved = pages > 1 ? PAGER_GAP + PAGER_H : 0
  const frameH = Math.min(Math.round(W / SHARE_RATIO), Math.max(0, H - STRIP_MIN_H - reserved - GRID_GAP))
  const stripH = Math.max(0, Math.min(stripTile(W).h, H - frameH - GRID_GAP - reserved))
  // the group sits in the middle of the stage rather than leaving a hole below it
  const top = Math.max(0, Math.round((H - (frameH + GRID_GAP + stripH + reserved)) / 2))
  const frame: Rect = { x: 0, y: top, w: W, h: frameH }
  const y = top + frameH + GRID_GAP
  layoutStrip(ordered, W, y, stripH, page, rects, hidden)
  const pager = pages > 1 ? { x: (W - PAGER_W) / 2, y: y + stripH + PAGER_GAP, w: PAGER_W, pages } : null
  return { rects, hidden, frame, pager }
}
