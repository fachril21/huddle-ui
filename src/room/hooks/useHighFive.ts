import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { Dispatch } from 'react'
import type { RoomAction } from '../../state/roomReducer'
import { SELF_ID } from '../../state/types'
import type { RoomState } from '../../state/types'

/** High-five wiring: expiry ticks, local cooldown re-render, the dock action, and screen-reader text. */
export function useHighFive(state: RoomState, dispatch: Dispatch<RoomAction>, announce: (text: string) => void) {
  const { offers, claims, matches, cooldowns } = state.highFive
  const busy = offers.length > 0 || claims.length > 0
  const [, rerender] = useReducer((n: number) => n + 1, 0)
  const seen = useRef({ offers: new Set<number>(), matches: new Set<number>() })
  const selfCooldownUntil = cooldowns[SELF_ID] ?? 0

  // Expire open offers and stale "Sudah disambut" toasts
  useEffect(() => {
    if (!busy) return
    const id = window.setInterval(() => dispatch({ type: 'hfTick', now: performance.now() }), 200)
    return () => window.clearInterval(id)
  }, [busy, dispatch])

  // Re-render when the local cooldown ends so the dock button re-enables
  useEffect(() => {
    const left = selfCooldownUntil - performance.now()
    if (left <= 0) return
    const id = window.setTimeout(() => rerender(), left + 20)
    return () => window.clearTimeout(id)
  }, [selfCooldownUntil])

  useEffect(() => {
    const names = (id: string) => state.participants.find((p) => p.id === id)?.name ?? ''
    for (const o of offers) {
      if (seen.current.offers.has(o.id)) continue
      seen.current.offers.add(o.id)
      if (o.fromId !== SELF_ID) announce(`${names(o.fromId)} mengajak high five`)
    }
    for (const m of matches) {
      if (seen.current.matches.has(m.id)) continue
      seen.current.matches.add(m.id)
      announce(`${names(m.aId)} dan ${names(m.bId)} high five`)
    }
  }, [offers, matches, state.participants, announce])

  /** Dock click: answer someone else's open offer, else toggle our own. */
  const onHighFive = useCallback(() => {
    const now = performance.now()
    const theirs = offers.find((o) => o.fromId !== SELF_ID)
    if (theirs) dispatch({ type: 'hfRespond', fromId: theirs.fromId, byId: SELF_ID, now })
    else if (offers.some((o) => o.fromId === SELF_ID)) dispatch({ type: 'hfCancel', fromId: SELF_ID })
    else dispatch({ type: 'hfOffer', fromId: SELF_ID, now })
    dispatch({ type: 'closeDock', key: 'reaction' })
  }, [offers, dispatch])

  return {
    onHighFive,
    active: offers.some((o) => o.fromId === SELF_ID),
    disabledReason: performance.now() < selfCooldownUntil ? 'Tunggu sebentar sebelum mengajak lagi' : undefined,
  }
}
