import { isTypingTarget } from '../room/shortcuts'

export type DashboardShortcut = 'instant' | 'code' | 'schedule'

type KeyInput = Pick<KeyboardEvent, 'code' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey' | 'repeat'> & { target: EventTarget | null }

const BY_CODE: Record<string, DashboardShortcut> = { KeyN: 'instant', KeyJ: 'code', KeyS: 'schedule' }

/** Single-key shortcuts like the room's. Never fires while typing or with a modifier held. */
export function matchDashboardShortcut(e: KeyInput): DashboardShortcut | null {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return null
  if (isTypingTarget(e.target)) return null
  return BY_CODE[e.code] ?? null
}

export const DASHBOARD_KEYS = { instant: 'N', code: 'J', schedule: 'S' } as const
