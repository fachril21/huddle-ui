import { useEffect, useRef, useState } from 'react'
import type { Dispatch } from 'react'
import type { RoomAction } from '../../state/roomReducer'
import { SELF_ID } from '../../state/types'
import type { Participant } from '../../state/types'
import { PAGE_SIZE, pageCount } from '../layoutMath'

/** Someone on page 2+ who keeps talking this long moves to page 1 (PRD 6.6). */
const PROMOTE_AFTER_MS = 3000

/**
 * Grid paging for rooms over 9 people: current page, a hint when someone on another page is speaking,
 * and promotion of a long-time speaker from a later page (the quietest person on page 1 swaps down).
 */
export function usePaging(participants: readonly Participant[], speaking: ReadonlySet<string>, dispatch: Dispatch<RoomAction>) {
  const [page, setPage] = useState(0)
  const pages = pageCount(participants.length)
  const current = Math.min(page, pages - 1)
  const lastSpoke = useRef(new Map<string, number>())
  const timers = useRef(new Map<string, number>())
  const latest = useRef({ participants, speaking })
  latest.current = { participants, speaking }

  useEffect(() => {
    const now = performance.now()
    for (const id of speaking) lastSpoke.current.set(id, now)

    const indexOf = (id: string) => latest.current.participants.findIndex((p) => p.id === id)
    for (const id of speaking) {
      if (indexOf(id) < PAGE_SIZE || timers.current.has(id)) continue
      const timer = window.setTimeout(() => {
        timers.current.delete(id)
        const { participants: list, speaking: still } = latest.current
        if (!still.has(id) || list.findIndex((p) => p.id === id) < PAGE_SIZE) return
        const quiet = list
          .slice(0, PAGE_SIZE)
          .filter((p) => p.id !== SELF_ID && !still.has(p.id))
          .sort((a, b) => (lastSpoke.current.get(a.id) ?? 0) - (lastSpoke.current.get(b.id) ?? 0))[0]
        if (quiet) dispatch({ type: 'swapParticipants', a: id, b: quiet.id })
      }, PROMOTE_AFTER_MS)
      timers.current.set(id, timer)
    }
    // stop waiting for people who went quiet before the deadline
    for (const [id, timer] of timers.current) {
      if (speaking.has(id)) continue
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [speaking, dispatch])

  useEffect(
    () => () => {
      for (const timer of timers.current.values()) window.clearTimeout(timer)
      timers.current.clear()
    },
    [],
  )

  const speakingElsewhere = participants.some((p, i) => speaking.has(p.id) && Math.floor(i / PAGE_SIZE) !== current)

  return { page: current, setPage, pages, speakingElsewhere }
}
