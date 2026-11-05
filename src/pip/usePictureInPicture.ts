import { useCallback, useEffect, useRef, useState } from 'react'
import { mirrorStyles } from './copyStyles'
import { getPipApi, PIP_HEIGHT, PIP_WIDTH, pipSupported } from './pipSupport'

export interface PictureInPicture {
  readonly supported: boolean
  /** The mini window while it is open */
  readonly window: Window | null
  /** Opens the window. Needs a recent click or key press; resolves false when the browser says no. */
  readonly open: () => Promise<boolean>
  readonly close: () => void
}

/** Owns one Document Picture-in-Picture window: opening it, copying styles into it, and noticing when the user closes it. */
export function usePictureInPicture(title: string): PictureInPicture {
  const supported = pipSupported()
  const [win, setWin] = useState<Window | null>(null)
  const winRef = useRef<Window | null>(null)

  const close = useCallback(() => {
    winRef.current?.close()
  }, [])

  const open = useCallback(async (): Promise<boolean> => {
    const api = getPipApi()
    if (!api) return false
    if (winRef.current) return true
    try {
      const next = await api.requestWindow({ width: PIP_WIDTH, height: PIP_HEIGHT })
      const stopMirroring = mirrorStyles(next.document)
      next.document.documentElement.lang = 'id'
      next.document.title = title
      winRef.current = next
      next.addEventListener(
        'pagehide',
        () => {
          stopMirroring()
          winRef.current = null
          setWin(null)
        },
        { once: true },
      )
      setWin(next)
      return true
    } catch {
      // NotAllowedError without a fresh user gesture, or the user's browser blocks it
      return false
    }
  }, [title])

  // Leaving the room takes the mini window with it
  useEffect(() => () => winRef.current?.close(), [])

  return { supported, window: win, open, close }
}
