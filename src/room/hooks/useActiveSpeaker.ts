import { useEffect, useState } from 'react'

/** A new dominant voice must hold the floor this long before the big tile switches to them. */
const SWITCH_DELAY_MS = 1200

/**
 * The last person who held the floor, debounced so the big tile does not flicker between overlapping voices.
 * It keeps its value during silence, so the stage does not jump back when everyone pauses.
 */
export function useActiveSpeaker(dominantId: string | null): string | null {
  const [speakerId, setSpeakerId] = useState<string | null>(null)

  useEffect(() => {
    if (!dominantId || dominantId === speakerId) return
    const timer = window.setTimeout(() => setSpeakerId(dominantId), SWITCH_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [dominantId, speakerId])

  return speakerId
}
