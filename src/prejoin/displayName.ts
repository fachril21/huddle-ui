export const MAX_NAME_LENGTH = 32
const STORAGE_KEY = 'huddle.displayName'
const FORGET_KEY = 'huddle.forgetName'

/** Trimmed, whitespace-collapsed, length-capped. Empty string means "not valid yet". */
export function normalizeName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH).trim()
}

export function isValidName(raw: string): boolean {
  return normalizeName(raw).length > 0
}

/** Remembered name, or empty. Storage can be unavailable, so every access is guarded. */
export function loadName(): string {
  try {
    return normalizeName(window.localStorage.getItem(STORAGE_KEY) ?? '')
  } catch {
    return ''
  }
}

export function saveName(name: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, name)
  } catch {
    // Not remembering the name is harmless
  }
}

/** Whether the lobby should keep the name for next time. On unless the person said otherwise. */
export function loadRemember(): boolean {
  try {
    return window.localStorage.getItem(FORGET_KEY) !== '1'
  } catch {
    return true
  }
}

/** What to do with the name when entering: keep it for next time, or wipe it (a shared computer should not greet the next person by name). */
export function persistName(name: string, remember: boolean) {
  try {
    if (remember) {
      window.localStorage.setItem(STORAGE_KEY, name)
      window.localStorage.removeItem(FORGET_KEY)
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
      window.localStorage.setItem(FORGET_KEY, '1')
    }
  } catch {
    // Not remembering the name is harmless
  }
}
