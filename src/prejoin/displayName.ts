export const MAX_NAME_LENGTH = 32
const STORAGE_KEY = 'huddle.displayName'

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
