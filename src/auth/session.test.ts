import { describe, expect, it } from 'vitest'
import { SESSION_TTL_DAYS, clearSession, createSession, loadSession, parseSession, saveSession } from './session'
import type { SessionStorage } from './session'

const NOW = Date.UTC(2026, 9, 21, 3, 0, 0)
const DAY = 24 * 60 * 60 * 1000

function fakeStorage(): SessionStorage {
  let value: string | null = null
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next
    },
    removeItem: () => {
      value = null
    },
  }
}

describe('createSession', () => {
  it('derives the display name from the email and sets the expiry from the policy', () => {
    const s = createSession('dewi.lestari@dibimbing.id', 'google', NOW)
    expect(s).toEqual({ email: 'dewi.lestari@dibimbing.id', name: 'Dewi Lestari', method: 'google', expiresAt: NOW + SESSION_TTL_DAYS * DAY })
  })
})

describe('parseSession', () => {
  const good = JSON.stringify(createSession('raka@cakrawala.ac.id', 'email', NOW))

  it('reads a valid stored session', () => {
    expect(parseSession(good, NOW + DAY)?.email).toBe('raka@cakrawala.ac.id')
  })

  it('returns null for nothing, junk or the wrong shape', () => {
    expect(parseSession(null, NOW)).toBeNull()
    expect(parseSession('not json', NOW)).toBeNull()
    expect(parseSession('[1]', NOW)).toBeNull()
    expect(parseSession(JSON.stringify({ email: 5 }), NOW)).toBeNull()
  })

  it('returns null once the session has expired', () => {
    expect(parseSession(good, NOW + SESSION_TTL_DAYS * DAY)).toBeNull()
  })

  it('does not trust stored data: an address outside the allowed domains is dropped', () => {
    const forged = JSON.stringify({ email: 'x@gmail.com', name: 'X', method: 'email', expiresAt: NOW + DAY })
    expect(parseSession(forged, NOW)).toBeNull()
  })

  it('drops an unknown sign-in method', () => {
    const odd = JSON.stringify({ email: 'x@dibimbing.id', name: 'X', method: 'magic', expiresAt: NOW + DAY })
    expect(parseSession(odd, NOW)).toBeNull()
  })
})

describe('load / save / clear', () => {
  it('round-trips through storage', () => {
    const storage = fakeStorage()
    saveSession(createSession('dewi@dibimbing.id', 'google', NOW), storage)
    expect(loadSession(NOW, storage)?.name).toBe('Dewi')
    clearSession(storage)
    expect(loadSession(NOW, storage)).toBeNull()
  })

  it('survives storage that throws', () => {
    const fail = () => {
      throw new Error('blocked')
    }
    const broken: SessionStorage = { getItem: fail, setItem: fail, removeItem: fail }
    expect(loadSession(NOW, broken)).toBeNull()
    expect(() => saveSession(createSession('dewi@dibimbing.id', 'email', NOW), broken)).not.toThrow()
    expect(() => clearSession(broken)).not.toThrow()
  })
})
