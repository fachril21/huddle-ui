import { bestGrid, GRID_GAP } from './gridLayout'

export interface Rect {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

export interface StageLayout {
  readonly rects: Readonly<Record<string, Rect>>
  /** Tiles parked off the current strip page: invisible and effect-free */
  readonly hidden: ReadonlySet<string>
  /** Shared screen frame (share mode only) */
  readonly frame: Rect | null
  /** Pager anchor below the strip (share mode with more than one page) */
  readonly pager: { x: number; y: number; w: number; pages: number } | null
}

const RATIO = 16 / 9
const STRIP_SLOTS = 4
const STRIP_MAX_W = 288
const PAGER_H = 28
const PAGER_GAP = 8

/** Up to 9 tiles per page once the room has more people (PRD 6.6). */
export const PAGE_SIZE = 9

export function pageCount(total: number, size: number = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / size))
}

/** One page of the regular grid: tiles of the largest 16:9 size, last row centered. */
function layoutPage(ids: readonly string[], W: number, H: number, into: Record<string, Rect>) {
  const { cols, tileW, tileH } = bestGrid(ids.length, W, H)
  const rows = Math.ceil(ids.length / cols)
  const totalH = rows * tileH + (rows - 1) * GRID_GAP
  const y0 = (H - totalH) / 2
  ids.forEach((id, i) => {
    const row = Math.floor(i / cols)
    const inRow = Math.min(cols, ids.length - row * cols)
    const x0 = (W - (inRow * tileW + (inRow - 1) * GRID_GAP)) / 2
    into[id] = { x: x0 + (i % cols) * (tileW + GRID_GAP), y: y0 + row * (tileH + GRID_GAP), w: tileW, h: tileH }
  })
}

/** Regular grid. Tiles on other pages keep their own page's slot but are hidden. */
export function gridLayout(ids: readonly string[], W: number, H: number, page = 0): StageLayout {
  const pages = pageCount(ids.length)
  const current = Math.min(page, pages - 1)
  const rects: Record<string, Rect> = {}
  const hidden = new Set<string>()
  for (let p = 0; p < pages; p++) {
    const slice = ids.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE)
    layoutPage(slice, W, H, rects)
    if (p !== current) slice.forEach((id) => hidden.add(id))
  }
  return { rects, hidden, frame: null, pager: null }
}

/** Share screen: big frame on the left, a strip of up to 4 camera tiles on the right (Design.md 14.4). */
export function shareLayout(ids: readonly string[], presenterId: string, W: number, H: number, page: number): StageLayout {
  const ordered = [presenterId, ...ids.filter((id) => id !== presenterId)]
  const pages = Math.ceil(ordered.length / STRIP_SLOTS)
  const reservedForPager = pages > 1 ? PAGER_GAP + PAGER_H : 0
  const maxTileW = Math.floor(((H - reservedForPager - GRID_GAP * (STRIP_SLOTS - 1)) / STRIP_SLOTS) * RATIO)
  const tileW = Math.max(0, Math.min(STRIP_MAX_W, maxTileW))
  const tileH = Math.round(tileW / RATIO)
  const slotsH = STRIP_SLOTS * tileH + (STRIP_SLOTS - 1) * GRID_GAP + reservedForPager
  const y0 = Math.max(0, (H - slotsH) / 2)
  const x0 = W - tileW
  const rects: Record<string, Rect> = {}
  const hidden = new Set<string>()
  const current = Math.min(page, pages - 1)
  ordered.forEach((id, i) => {
    const slot = i % STRIP_SLOTS
    rects[id] = { x: x0, y: y0 + slot * (tileH + GRID_GAP), w: tileW, h: tileH }
    if (Math.floor(i / STRIP_SLOTS) !== current) hidden.add(id)
  })
  const frame = { x: 0, y: 0, w: Math.max(0, x0 - GRID_GAP), h: H }
  const pager = pages > 1 ? { x: x0, y: y0 + STRIP_SLOTS * (tileH + GRID_GAP) - GRID_GAP + PAGER_GAP, w: tileW, pages } : null
  return { rects, hidden, frame, pager }
}

/** Largest 16:9 box that fits inside w x h, centered there. */
function fitCentered(x: number, y: number, w: number, h: number): Rect {
  const tileW = Math.floor(Math.max(0, Math.min(w, h * RATIO)))
  const tileH = Math.round(tileW / RATIO)
  return { x: x + (w - tileW) / 2, y: y + (h - tileH) / 2, w: tileW, h: tileH }
}

const SPEAKER_STRIP_H = 112
const SPEAKER_STRIP_W = Math.round(SPEAKER_STRIP_H * RATIO)
const SPEAKER_STRIP_MAX = 6
const PAGER_W = 120

/** Pembicara: one big tile for the focused person and a filmstrip of everyone else along the bottom. */
export function speakerLayout(ids: readonly string[], focusId: string, W: number, H: number, page: number): StageLayout {
  const others = ids.filter((id) => id !== focusId)
  const rects: Record<string, Rect> = {}
  const hidden = new Set<string>()
  if (!others.length) {
    layoutPage([focusId], W, H, rects)
    return { rects, hidden, frame: null, pager: null }
  }
  const slots = Math.max(1, Math.min(SPEAKER_STRIP_MAX, Math.floor((W + GRID_GAP) / (SPEAKER_STRIP_W + GRID_GAP))))
  const pages = Math.ceil(others.length / slots)
  const reserved = pages > 1 ? PAGER_GAP + PAGER_H : 0
  const mainH = Math.max(0, H - SPEAKER_STRIP_H - reserved - GRID_GAP)
  rects[focusId] = fitCentered(0, 0, W, mainH)
  const current = Math.min(page, pages - 1)
  const y = mainH + GRID_GAP
  others.forEach((id, i) => {
    const pageIndex = Math.floor(i / slots)
    const onPage = Math.min(slots, others.length - pageIndex * slots)
    const x0 = (W - (onPage * SPEAKER_STRIP_W + (onPage - 1) * GRID_GAP)) / 2
    rects[id] = { x: x0 + (i % slots) * (SPEAKER_STRIP_W + GRID_GAP), y, w: SPEAKER_STRIP_W, h: SPEAKER_STRIP_H }
    if (pageIndex !== current) hidden.add(id)
  })
  const pager = pages > 1 ? { x: (W - PAGER_W) / 2, y: y + SPEAKER_STRIP_H + PAGER_GAP, w: PAGER_W, pages } : null
  return { rects, hidden, frame: null, pager }
}

/** Sorotan: the focused person large on the left and a vertical strip of up to 4 others on the right. */
export function spotlightLayout(ids: readonly string[], focusId: string, W: number, H: number, page: number): StageLayout {
  const others = ids.filter((id) => id !== focusId)
  const rects: Record<string, Rect> = {}
  const hidden = new Set<string>()
  if (!others.length) {
    layoutPage([focusId], W, H, rects)
    return { rects, hidden, frame: null, pager: null }
  }
  const pages = Math.ceil(others.length / STRIP_SLOTS)
  const reserved = pages > 1 ? PAGER_GAP + PAGER_H : 0
  const maxTileW = Math.floor(((H - reserved - GRID_GAP * (STRIP_SLOTS - 1)) / STRIP_SLOTS) * RATIO)
  const tileW = Math.max(0, Math.min(STRIP_MAX_W, maxTileW))
  const tileH = Math.round(tileW / RATIO)
  const slotsH = STRIP_SLOTS * tileH + (STRIP_SLOTS - 1) * GRID_GAP + reserved
  const y0 = Math.max(0, (H - slotsH) / 2)
  const x0 = W - tileW
  rects[focusId] = fitCentered(0, 0, Math.max(0, x0 - GRID_GAP), H)
  const current = Math.min(page, pages - 1)
  others.forEach((id, i) => {
    rects[id] = { x: x0, y: y0 + (i % STRIP_SLOTS) * (tileH + GRID_GAP), w: tileW, h: tileH }
    if (Math.floor(i / STRIP_SLOTS) !== current) hidden.add(id)
  })
  const pager = pages > 1 ? { x: x0, y: y0 + STRIP_SLOTS * (tileH + GRID_GAP) - GRID_GAP + PAGER_GAP, w: tileW, pages } : null
  return { rects, hidden, frame: null, pager }
}
