import { useCallback, useEffect, useRef, useState } from 'react'
import type { Dispatch } from 'react'
import type { RoomAction } from '../state/roomReducer'
import { SCENARIOS } from './scenarios'
import type { Scenario } from './scenarios'

export type PlayerStatus = 'idle' | 'playing' | 'paused' | 'done'
export type PlayerSpeed = 1 | 1.5

export interface ScenarioPlayer {
  readonly scenario: Scenario
  readonly status: PlayerStatus
  readonly elapsed: number
  readonly speed: PlayerSpeed
  select: (id: string) => void
  toggle: () => void
  restart: () => void
  setSpeed: (speed: PlayerSpeed) => void
}

const UI_TICK_MS = 200

/**
 * Plays timed scenarios by dispatching the same actions the Demo Director buttons use.
 * Time advances by real elapsed time times the chosen speed; each step fires once.
 */
export function useScenarioPlayer(dispatch: Dispatch<RoomAction>): ScenarioPlayer {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id)
  const [status, setStatus] = useState<PlayerStatus>('idle')
  const [speed, setSpeed] = useState<PlayerSpeed>(1)
  const [elapsed, setElapsed] = useState(0)
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0]

  const clock = useRef({ elapsed: 0, last: 0, fired: new Set<number>() })
  const live = useRef({ scenario, speed })
  live.current = { scenario, speed }

  const rewind = useCallback(() => {
    clock.current = { elapsed: 0, last: performance.now(), fired: new Set() }
    setElapsed(0)
  }, [])

  const restart = useCallback(() => {
    dispatch({ type: 'reset' })
    rewind()
    setStatus('playing')
  }, [dispatch, rewind])

  const toggle = useCallback(() => {
    if (status === 'playing') setStatus('paused')
    else if (status === 'paused') {
      clock.current.last = performance.now()
      setStatus('playing')
    } else restart()
  }, [status, restart])

  const select = useCallback(
    (id: string) => {
      setScenarioId(id)
      setStatus('idle')
      rewind()
    },
    [rewind],
  )

  useEffect(() => {
    if (status !== 'playing') return
    let raf = 0
    let lastUi = 0
    const tick = (now: number) => {
      const c = clock.current
      const { scenario: s, speed: v } = live.current
      c.elapsed += Math.min((now - c.last) / 1000, 0.25) * v
      c.last = now
      s.steps.forEach((step, i) => {
        if (c.elapsed >= step.at && !c.fired.has(i)) {
          c.fired.add(i)
          for (const action of step.run(performance.now())) dispatch(action)
        }
      })
      if (now - lastUi > UI_TICK_MS) {
        lastUi = now
        setElapsed(Math.min(c.elapsed, s.durationS))
      }
      if (c.elapsed >= s.durationS) {
        if (s.endsMeeting) dispatch({ type: 'leave', phase: 'ended' })
        setElapsed(s.durationS)
        setStatus('done')
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [status, dispatch])

  return { scenario, status, elapsed, speed, select, toggle, restart, setSpeed }
}
