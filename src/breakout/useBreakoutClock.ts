import { useEffect, useState } from 'react'
import type { Dispatch } from 'react'
import type { RoomAction } from '../state/actions'
import type { RoomState } from '../state/types'
import { isLive } from './rooms'

const TICK_MS = 500

/**
 * Drives the auto-close timer and the 60 s wrap-up, and returns performance.now() refreshed while the rooms are live
 * so every countdown on screen reads the same clock.
 */
export function useBreakoutClock(state: RoomState, dispatch: Dispatch<RoomAction>): number {
  const live = isLive(state.breakout)
  const [now, setNow] = useState(() => performance.now())

  useEffect(() => {
    if (!live) return
    const tick = () => {
      const t = performance.now()
      setNow(t)
      dispatch({ type: 'breakoutTick', now: t })
    }
    tick()
    const id = window.setInterval(tick, TICK_MS)
    return () => window.clearInterval(id)
  }, [live, dispatch])

  return now
}
