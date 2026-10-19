import { useEffect } from 'react'
import { isMissing } from './deviceSettings'

/** A chosen device that disappears falls back to the system default, so the picker never shows a ghost. */
export function useDeviceFallback(chosenId: string, available: readonly { readonly id: string }[], onMissing: () => void) {
  const missing = isMissing(chosenId, available)
  useEffect(() => {
    if (missing) onMissing()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to the device disappearing, not to a new callback identity
  }, [missing])
}
