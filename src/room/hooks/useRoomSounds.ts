import { useEffect, useRef } from 'react'
import { deriveCues } from '../../audio/roomCues'
import { playCue, preloadSoundCues } from '../../audio/fileSounds'
import type { RoomState } from '../../state/types'

/** Plays the sound effect that matches each room event (mic, hand, share, chat, join/leave, connection). */
export function useRoomSounds(state: RoomState) {
  const previous = useRef<RoomState | null>(null)

  useEffect(() => preloadSoundCues(), [])

  useEffect(() => {
    const before = previous.current
    previous.current = state
    if (!before || before === state) return
    for (const cue of deriveCues(before, state)) playCue(cue)
  }, [state])
}
