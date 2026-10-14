/** Single-key shortcuts for the room. One registry feeds the key handler, the tooltips and the help list. */
export type ShortcutId =
  | 'mic'
  | 'camera'
  | 'share'
  | 'hand'
  | 'reaction'
  | 'highFive'
  | 'soundboard'
  | 'chat'
  | 'participants'
  | 'invite'
  | 'layout'
  | 'annotate'
  | 'help'

export interface Shortcut {
  readonly id: ShortcutId
  /** KeyboardEvent.code, so the shortcut works on any keyboard layout */
  readonly code: string
  /** Text shown on the key cap */
  readonly key: string
  readonly label: string
}

export const SHORTCUTS: readonly Shortcut[] = [
  { id: 'mic', code: 'KeyM', key: 'M', label: 'Nyalakan / matikan mikrofon' },
  { id: 'camera', code: 'KeyV', key: 'V', label: 'Nyalakan / matikan kamera' },
  { id: 'share', code: 'KeyS', key: 'S', label: 'Bagikan layar' },
  { id: 'hand', code: 'KeyH', key: 'H', label: 'Angkat / turunkan tangan' },
  { id: 'reaction', code: 'KeyR', key: 'R', label: 'Reaction' },
  { id: 'highFive', code: 'Digit5', key: '5', label: 'High five' },
  { id: 'soundboard', code: 'KeyB', key: 'B', label: 'Soundboard' },
  { id: 'chat', code: 'KeyC', key: 'C', label: 'Panel chat' },
  { id: 'participants', code: 'KeyP', key: 'P', label: 'Panel peserta' },
  { id: 'invite', code: 'KeyI', key: 'I', label: 'Undang lewat tautan' },
  { id: 'layout', code: 'KeyL', key: 'L', label: 'Tampilan layar' },
  { id: 'annotate', code: 'KeyA', key: 'A', label: 'Coret layar yang dibagikan' },
  { id: 'help', code: 'Slash', key: '?', label: 'Daftar pintasan' },
]

/** Hold to talk while the microphone is off. Handled separately because it reacts to key release. */
export const PUSH_TO_TALK = { code: 'Space', key: 'Spasi', label: 'Tahan untuk bicara sementara' } as const

const BY_ID = new Map(SHORTCUTS.map((s) => [s.id, s]))

export function shortcutKey(id: ShortcutId): string {
  return BY_ID.get(id)?.key ?? ''
}

type KeyInput = Pick<KeyboardEvent, 'code' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey' | 'repeat'>

/** The shortcut a key press triggers, or null. `?` is Shift+Slash; every other shortcut forbids modifiers. */
export function matchShortcut(e: KeyInput): ShortcutId | null {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return null
  const hit = SHORTCUTS.find((s) => s.code === e.code)
  if (!hit) return null
  return hit.id === 'help' ? (e.shiftKey ? 'help' : null) : e.shiftKey ? null : hit.id
}

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

/** True when the key press belongs to a text field or another widget that handles keys itself. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return TYPING_TAGS.has(target.tagName) || target.isContentEditable
}
