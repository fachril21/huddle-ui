import { useLayoutEffect, useRef, useState } from 'react'

export interface GridLayout {
  readonly cols: number
  readonly tileW: number
  readonly tileH: number
}

const TILE_RATIO = 16 / 9
export const GRID_GAP = 12

/** Pick the column count that gives the largest 16:9 tiles inside w x h. */
export function bestGrid(count: number, w: number, h: number, gap = GRID_GAP): GridLayout {
  let best: GridLayout = { cols: 1, tileW: 0, tileH: 0 }
  if (count < 1 || w <= 0 || h <= 0) return best
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols)
    const byWidth = (w - gap * (cols - 1)) / cols
    const byHeight = ((h - gap * (rows - 1)) / rows) * TILE_RATIO
    const tileW = Math.floor(Math.min(byWidth, byHeight))
    if (tileW > best.tileW) best = { cols, tileW, tileH: Math.round(tileW / TILE_RATIO) }
  }
  return best
}

/** Observe an element's content box. */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, size] as const
}
