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

/** Regular grid: tiles of the largest 16:9 size, last row centered. */
export function gridLayout(ids: readonly string[], W: number, H: number): StageLayout {
  const { cols, tileW, tileH } = bestGrid(ids.length, W, H)
  const rows = Math.ceil(ids.length / cols)
  const totalH = rows * tileH + (rows - 1) * GRID_GAP
  const y0 = (H - totalH) / 2
  const rects: Record<string, Rect> = {}
  ids.forEach((id, i) => {
    const row = Math.floor(i / cols)
    const inRow = Math.min(cols, ids.length - row * cols)
    const x0 = (W - (inRow * tileW + (inRow - 1) * GRID_GAP)) / 2
    rects[id] = { x: x0 + (i % cols) * (tileW + GRID_GAP), y: y0 + row * (tileH + GRID_GAP), w: tileW, h: tileH }
  })
  return { rects, hidden: new Set(), frame: null, pager: null }
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
