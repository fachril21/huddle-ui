import { useRef } from 'react'
import type { PointerEvent } from 'react'

/** Horizontal travel, in px, that counts as a swipe rather than a tap or a drift. */
export const SWIPE_DISTANCE = 56
/** How much more horizontal than vertical the movement must be. */
export const SWIPE_DOMINANCE = 1.6

/** -1 for a swipe to the right (previous), 1 for a swipe to the left (next), 0 when it was not a swipe. */
export function swipeDirection(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * SWIPE_DOMINANCE) return 0
  return dx < 0 ? 1 : -1
}

/** Pointer handlers that call back with a direction on a touch swipe. Mouse and pen are ignored. */
export function useSwipe(onSwipe: (direction: -1 | 1) => void, enabled = true) {
  const start = useRef<{ x: number; y: number; id: number } | null>(null)
  if (!enabled) return {}
  return {
    onPointerDown: (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return
      start.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
    },
    onPointerUp: (e: PointerEvent) => {
      const s = start.current
      if (!s || s.id !== e.pointerId) return
      start.current = null
      const direction = swipeDirection(e.clientX - s.x, e.clientY - s.y)
      if (direction !== 0) onSwipe(direction)
    },
    onPointerCancel: () => {
      start.current = null
    },
  }
}
