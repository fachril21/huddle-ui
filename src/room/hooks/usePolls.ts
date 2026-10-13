import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch } from 'react'
import { playPollChime } from '../../audio/notifySounds'
import { tally } from '../../features/polls/pollMath'
import type { RoomAction } from '../../state/roomReducer'
import { SELF_ID } from '../../state/types'
import type { RoomState } from '../../state/types'

const VOTE_DELAY_MS: readonly [number, number] = [900, 2200]

/** Poll wiring: auto-close ticks, simulated votes from other participants, chime, toast, announcements. */
export function usePolls(state: RoomState, dispatch: Dispatch<RoomAction>, announce: (text: string) => void) {
  const poll = state.polls[0]
  const active = poll?.status === 'active' ? poll : undefined
  const selfVoted = Boolean(poll?.votes[SELF_ID])
  const [dismissed, setDismissed] = useState<number | null>(null)
  const announced = useRef({ started: new Set<number>(), closed: new Set<number>() })
  const voteCount = active ? Object.keys(active.votes).length : 0

  // Auto-close
  useEffect(() => {
    if (!active || active.autoCloseS === null) return
    const id = window.setInterval(() => dispatch({ type: 'pollTick', now: performance.now() }), 500)
    return () => window.clearInterval(id)
  }, [active, dispatch])

  // Simulated votes: one participant at a time, at a natural pace, until everyone voted
  useEffect(() => {
    if (!active) return
    const waiting = state.participants.filter((p) => p.id !== SELF_ID && !active.votes[p.id])
    if (!waiting.length) return
    const delay = VOTE_DELAY_MS[0] + Math.random() * (VOTE_DELAY_MS[1] - VOTE_DELAY_MS[0])
    const id = window.setTimeout(() => {
      const voter = waiting[Math.floor(Math.random() * waiting.length)]
      const picks = active.options.map((o) => o.id).sort(() => Math.random() - 0.5)
      const count = active.multiple ? 1 + Math.floor(Math.random() * 2) : 1
      dispatch({ type: 'pollVote', voterId: voter.id, optionIds: picks.slice(0, count) })
    }, delay)
    return () => window.clearTimeout(id)
  }, [active, voteCount, state.participants, dispatch])

  // Chime and screen-reader text when a poll starts or closes
  useEffect(() => {
    if (!poll) return
    if (poll.status === 'active' && !announced.current.started.has(poll.id)) {
      announced.current.started.add(poll.id)
      playPollChime()
      announce(`Polling baru: ${poll.question}`)
    }
    if (poll.status === 'closed' && !announced.current.closed.has(poll.id)) {
      announced.current.closed.add(poll.id)
      const t = tally(poll)
      const names = poll.options.filter((o) => t.winners.includes(o.id)).map((o) => o.text)
      announce(t.isTie ? `Polling ditutup. Seri: ${names.join(', ')}` : names[0] ? `Polling ditutup. Menang: ${names[0]}` : 'Polling ditutup tanpa suara')
    }
  }, [poll, announce])

  const toastQuestion = useMemo(
    () => (active && active.creatorId !== SELF_ID && !selfVoted && dismissed !== active.id && state.panel !== 'polling' ? active.question : null),
    [active, selfVoted, dismissed, state.panel],
  )

  return {
    toastQuestion,
    dismissToast: () => {
      if (active) setDismissed(active.id)
    },
    pendingBadge: active && !selfVoted ? 1 : 0,
  }
}
