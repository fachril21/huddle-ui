import { useEffect, useRef, useState } from 'react'
import type { Dispatch } from 'react'
import type { RoomAction } from '../state/actions'
import { MAIN_ROOM, SELF_ID } from '../state/types'
import type { RoomState } from '../state/types'
import { locationOf, roomName, toneOfRoom } from './rooms'
import styles from './RoomWash.module.css'

/** Crossing into or out of a room: say so in a notice, and let the destination's hue wash over the screen once. */
export function RoomWash({ state, dispatch }: { state: RoomState; dispatch: Dispatch<RoomAction> }) {
  const b = state.breakout
  const here = locationOf(b, SELF_ID)
  const previous = useRef(here)
  const [wash, setWash] = useState<{ key: number; tone: string } | null>(null)

  useEffect(() => {
    if (previous.current === here) return
    previous.current = here
    const text = here === MAIN_ROOM ? 'Anda kembali ke ruang utama' : `Anda masuk ${roomName(b, here)}`
    dispatch({ type: 'notice', text, now: performance.now() })
    setWash((w) => ({ key: (w?.key ?? 0) + 1, tone: here === MAIN_ROOM ? 'cyan' : toneOfRoom(b, here) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the move matters, not later renames
  }, [here])

  return wash ? <div key={wash.key} className={styles.wash} data-tone={wash.tone} aria-hidden="true" /> : null
}
