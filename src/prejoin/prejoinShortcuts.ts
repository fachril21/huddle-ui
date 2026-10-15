import { isTypingTarget } from '../room/shortcuts'

export type PrejoinShortcut = 'join' | 'mic' | 'camera'

type KeyInput = Pick<KeyboardEvent, 'code' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey' | 'repeat'> & { target: EventTarget | null }

const BY_CODE: Record<string, PrejoinShortcut> = { KeyM: 'mic', KeyV: 'camera' }

/**
 * Lobby shortcuts: M and V match the room. Enter joins unless a field or button owns the key,
 * so typing a name and pressing Enter in the field is handled by the form, not here.
 */
export function matchPrejoinShortcut(e: KeyInput): PrejoinShortcut | null {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return null
  if (e.code === 'Enter' || e.code === 'NumpadEnter') return isTypingTarget(e.target) || isInteractive(e.target) ? null : 'join'
  if (isTypingTarget(e.target)) return null
  return BY_CODE[e.code] ?? null
}

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.tagName === 'BUTTON' || target.tagName === 'A')
}

export const PREJOIN_KEYS = { join: 'Enter', mic: 'M', camera: 'V' } as const
