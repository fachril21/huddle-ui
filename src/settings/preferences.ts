import { NO_BACKGROUND, parseBackground } from '../background/backgrounds'
import type { BackgroundChoice } from '../background/backgrounds'
import type { FxTier } from '../state/types'

const STORAGE_KEY = 'huddle.preferences.v1'

/** What the Pengaturan page remembers. Device ids are the defaults the lobby starts on; empty follows the system. */
export interface Preferences {
  /** null = no choice yet, so the screen size decides */
  readonly fx: FxTier | null
  readonly cameraId: string
  readonly micId: string
  readonly speakerId: string
  /** Remind me before a recording is deleted (the prototype only remembers the choice) */
  readonly expiryReminder: boolean
  /** Short sounds for room events: someone joins, a message arrives */
  readonly notifySounds: boolean
  /** What the lobby starts with behind the person */
  readonly background: BackgroundChoice
}

export const DEFAULT_PREFERENCES: Preferences = {
  fx: null,
  cameraId: '',
  micId: '',
  speakerId: '',
  expiryReminder: true,
  notifySounds: true,
  background: NO_BACKGROUND,
}

const FX_TIERS: readonly FxTier[] = ['full', 'lite', 'off']

/** Stored JSON back to preferences. Each field is checked on its own, so one bad value never loses the rest. */
export function parsePreferences(json: string | null): Preferences {
  if (!json) return DEFAULT_PREFERENCES
  try {
    const data: unknown = JSON.parse(json)
    if (typeof data !== 'object' || data === null) return DEFAULT_PREFERENCES
    const d = data as Record<string, unknown>
    const text = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback)
    const flag = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback)
    return {
      fx: FX_TIERS.includes(d.fx as FxTier) ? (d.fx as FxTier) : null,
      cameraId: text(d.cameraId, ''),
      micId: text(d.micId, ''),
      speakerId: text(d.speakerId, ''),
      expiryReminder: flag(d.expiryReminder, DEFAULT_PREFERENCES.expiryReminder),
      notifySounds: flag(d.notifySounds, DEFAULT_PREFERENCES.notifySounds),
      background: parseBackground(d.background),
    }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function loadPreferences(): Preferences {
  try {
    return parsePreferences(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return DEFAULT_PREFERENCES
  }
}

/** Merge a change into what is stored and return the result. Storage can be unavailable; the change then lasts for the session. */
export function savePreferences(patch: Partial<Preferences>): Preferences {
  const next = { ...loadPreferences(), ...patch }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Not remembering the choice is harmless
  }
  return next
}
