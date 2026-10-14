import { useEffect, useRef } from 'react'
import { isTypingTarget, matchShortcut, PUSH_TO_TALK } from '../shortcuts'
import type { ShortcutId } from '../shortcuts'

export type ShortcutHandlers = Partial<Record<ShortcutId, () => void>>

interface PushToTalk {
  micOn: boolean
  setMic: (on: boolean) => void
}

const INTERACTIVE = 'button, a[href], summary, [role="button"], [role="menuitem"], [role="radio"]'

/**
 * Room keyboard shortcuts plus hold-Space push-to-talk. Ignored while typing and while a modal dialog is open.
 * Handlers are read through a ref, so the listener is attached once.
 */
export function useShortcuts(handlers: ShortcutHandlers, pushToTalk: PushToTalk, enabled: boolean) {
  const latest = useRef({ handlers, pushToTalk, enabled })
  latest.current = { handlers, pushToTalk, enabled }
  const talking = useRef(false)

  useEffect(() => {
    const endTalk = () => {
      if (!talking.current) return
      talking.current = false
      latest.current.pushToTalk.setMic(false)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const { handlers: map, pushToTalk: ptt, enabled: on } = latest.current
      if (!on || e.defaultPrevented || isTypingTarget(e.target) || document.querySelector('[aria-modal="true"]')) return

      if (e.code === PUSH_TO_TALK.code && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        // Space on a focused button must keep activating it
        if (talking.current) return e.preventDefault()
        if (e.repeat || ptt.micOn || (e.target instanceof Element && e.target.closest(INTERACTIVE))) return
        e.preventDefault()
        talking.current = true
        ptt.setMic(true)
        return
      }

      const id = matchShortcut(e)
      const run = id ? map[id] : undefined
      if (!run) return
      e.preventDefault()
      run()
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === PUSH_TO_TALK.code) endTalk()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', endTalk)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', endTalk)
    }
  }, [])
}
