import { useCallback, useEffect, useRef } from 'react'
import type { Dispatch } from 'react'
import { SOUND_BY_ID, playSound } from '../../audio/soundboardSounds'
import type { RoomAction } from '../../state/roomReducer'
import { SELF_ID } from '../../state/types'
import type { RoomState } from '../../state/types'

/** Soundboard wiring: plays each new sound once (for everyone), expires chips, exposes the local play action. */
export function useSoundboard(state: RoomState, dispatch: Dispatch<RoomAction>) {
  const { plays, allowed, lastPlayAt } = state.soundboard
  /** Play ids restart at 1 once every chip has expired, so a play is told apart by id and start time */
  const played = useRef(new Set<string>())

  useEffect(() => {
    for (const p of plays) {
      const key = `${p.id}:${p.startedAt}`
      if (played.current.has(key)) continue
      played.current.add(key)
      playSound(p.soundId)
    }
  }, [plays])

  useEffect(() => {
    if (!plays.length) return
    const id = window.setInterval(() => dispatch({ type: 'sbExpire', now: performance.now() }), 250)
    return () => window.clearInterval(id)
  }, [plays.length, dispatch])

  const onPlay = useCallback(
    (soundId: string) => {
      const def = SOUND_BY_ID[soundId]
      if (def) dispatch({ type: 'sbPlay', fromId: SELF_ID, soundId, durationMs: def.durationMs, now: performance.now() })
    },
    [dispatch],
  )

  return {
    onPlay,
    plays,
    players: new Set(plays.map((p) => p.fromId)),
    selfLastPlayAt: lastPlayAt[SELF_ID] ?? 0,
    disabledReason: allowed ? undefined : 'Soundboard dimatikan host',
  }
}
