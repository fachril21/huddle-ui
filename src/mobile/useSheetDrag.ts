import { useRef } from 'react'
import type { PointerEvent, RefObject } from 'react'
import { shouldCloseSheet } from './viewport'

/**
 * Drag-down-to-close for a bottom sheet. Attach the returned handlers to the grab area (handle and header),
 * not the scrolling body, so scrolling a long list never fights the gesture.
 */
export function useSheetDrag(target: RefObject<HTMLElement | null>, onClose: () => void) {
  const start = useRef<{ y: number; t: number; id: number } | null>(null)

  const setOffset = (px: number) => target.current?.style.setProperty('--drag-y', `${px}px`)

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    start.current = { y: e.clientY, t: performance.now(), id: e.pointerId }
    e.currentTarget.setPointerCapture(e.pointerId)
    target.current?.setAttribute('data-dragging', '')
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!start.current || start.current.id !== e.pointerId) return
    // dragging up past the resting position resists instead of lifting the sheet off the bottom edge
    const dy = e.clientY - start.current.y
    setOffset(dy > 0 ? dy : dy / 6)
  }

  const finish = (e: PointerEvent<HTMLElement>, cancelled: boolean) => {
    const s = start.current
    if (!s || s.id !== e.pointerId) return
    start.current = null
    target.current?.removeAttribute('data-dragging')
    const distance = e.clientY - s.y
    const velocity = distance / Math.max(1, performance.now() - s.t)
    if (!cancelled && shouldCloseSheet(distance, velocity)) onClose()
    else setOffset(0)
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: (e: PointerEvent<HTMLElement>) => finish(e, false),
    onPointerCancel: (e: PointerEvent<HTMLElement>) => finish(e, true),
  }
}
