import { nameFromEmail } from '../dashboard/people'
import { isAllowedDomain } from './domains'

const STORAGE_KEY = 'huddle.session.v1'

/**
 * How long a sign-in lasts. A placeholder for the prototype: the engineers set the real policy,
 * and in production the session is an httpOnly cookie issued by the server, not browser storage.
 */
export const SESSION_TTL_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000
const METHODS = ['google', 'email'] as const

export type SignInMethod = (typeof METHODS)[number]

export interface Session {
  readonly email: string
  readonly name: string
  readonly method: SignInMethod
  readonly expiresAt: number
}

/** The slice of Storage this module needs, so tests (and a blocked browser) can stand in for it. */
export interface SessionStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function browserStorage(): SessionStorage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function createSession(email: string, method: SignInMethod, now: number): Session {
  return { email, name: nameFromEmail(email), method, expiresAt: now + SESSION_TTL_DAYS * DAY_MS }
}

/** Stored JSON back to a session. Anything off (shape, domain, method, age) means signed out. */
export function parseSession(json: string | null, now: number): Session | null {
  if (!json) return null
  try {
    const data: unknown = JSON.parse(json)
    if (typeof data !== 'object' || data === null) return null
    const d = data as Record<string, unknown>
    const { email, name, method, expiresAt } = d
    if (typeof email !== 'string' || typeof name !== 'string' || typeof expiresAt !== 'number') return null
    if (!METHODS.includes(method as SignInMethod)) return null
    if (expiresAt <= now) return null
    const domain = email.split('@')[1]
    if (!domain || !isAllowedDomain(domain)) return null
    return { email, name, method: method as SignInMethod, expiresAt }
  } catch {
    return null
  }
}

export function loadSession(now: number = Date.now(), storage: SessionStorage | null = browserStorage()): Session | null {
  try {
    return parseSession(storage?.getItem(STORAGE_KEY) ?? null, now)
  } catch {
    return null
  }
}

export function saveSession(session: Session, storage: SessionStorage | null = browserStorage()): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Not remembering the sign-in just means signing in again next visit
  }
}

export function clearSession(storage: SessionStorage | null = browserStorage()): void {
  try {
    storage?.removeItem(STORAGE_KEY)
  } catch {
    // Nothing stored, or storage is blocked: either way there is nothing left to clear
  }
}
