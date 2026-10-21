import { describe, expect, it } from 'vitest'
import { buildSeed } from '../dashboard/seed'
import type { Meeting } from '../dashboard/types'
import { inviteCodeFromPath, inviteTarget } from './inviteEntry'

describe('inviteCodeFromPath', () => {
  it('reads a meeting code from the path', () => {
    expect(inviteCodeFromPath('/abc-defg-hij')).toBe('abc-defg-hij')
    expect(inviteCodeFromPath('/ABC-defg-hij/')).toBe('abc-defg-hij')
  })

  it('returns null for the home page and for anything that is not a code', () => {
    expect(inviteCodeFromPath('/')).toBeNull()
    expect(inviteCodeFromPath('')).toBeNull()
    expect(inviteCodeFromPath('/login')).toBeNull()
    expect(inviteCodeFromPath('/abc-defg-hij/extra')).toBeNull()
  })
})

describe('inviteTarget', () => {
  const base = buildSeed(new Date('2026-10-21T03:00:00Z'), 'Dewi').find((m) => m.code === 'abc-defg-hij') as Meeting
  const withRoom = (waitingRoom: boolean, isHost: boolean): Meeting => ({ ...base, isHost, security: { ...base.security, waitingRoom } })

  it('uses the title and host of a meeting it knows', () => {
    const t = inviteTarget('abc-defg-hij', [base], false)
    expect(t.title).toBe(base.title)
    expect(t.hostName).toBe('Dewi')
  })

  it('still opens a lobby for a code it does not know', () => {
    const t = inviteTarget('zzz-zzzz-zzz', [base], false)
    expect(t.code).toBe('zzz-zzzz-zzz')
    expect(t.needsApproval).toBeUndefined()
  })

  it('makes a guest ask to join when the meeting has a waiting room, even if the signed-in owner is its host', () => {
    expect(inviteTarget(base.code, [withRoom(true, true)], false).needsApproval).toBe(true)
  })

  it('lets the signed-in host straight in', () => {
    const t = inviteTarget(base.code, [withRoom(true, true)], true)
    expect(t.needsApproval).toBe(false)
    expect(t.hostPresent).toBe(true)
  })
})
