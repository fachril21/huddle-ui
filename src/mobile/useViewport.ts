import { useSyncExternalStore } from 'react'
import { classifyViewport, keyboardInset } from './viewport'
import type { ViewportInfo } from './viewport'

const COARSE_QUERY = '(pointer: coarse)'
const SERVER: ViewportInfo = classifyViewport(1280, 800, false)

let cached: ViewportInfo = SERVER

function read(): ViewportInfo {
  const next = classifyViewport(window.innerWidth, window.innerHeight, window.matchMedia(COARSE_QUERY).matches)
  const same = next.width === cached.width && next.height === cached.height && next.coarse === cached.coarse
  if (!same) cached = next
  return cached
}

function subscribe(callback: () => void) {
  const mq = window.matchMedia(COARSE_QUERY)
  window.addEventListener('resize', callback)
  window.addEventListener('orientationchange', callback)
  mq.addEventListener('change', callback)
  return () => {
    window.removeEventListener('resize', callback)
    window.removeEventListener('orientationchange', callback)
    mq.removeEventListener('change', callback)
  }
}

/** Size class, orientation and input type, kept current on resize and rotation. */
export function useViewport(): ViewportInfo {
  return useSyncExternalStore(subscribe, read, () => SERVER)
}

function subscribeVisual(callback: () => void) {
  const vv = window.visualViewport
  vv?.addEventListener('resize', callback)
  vv?.addEventListener('scroll', callback)
  return () => {
    vv?.removeEventListener('resize', callback)
    vv?.removeEventListener('scroll', callback)
  }
}

const readInset = () => {
  const vv = window.visualViewport
  return vv ? keyboardInset(window.innerHeight, vv.height, vv.offsetTop) : 0
}

/** Height of the on-screen keyboard, 0 when closed. Lets a bottom bar or input stay above it. */
export function useKeyboardInset(): number {
  return useSyncExternalStore(subscribeVisual, readInset, () => 0)
}
