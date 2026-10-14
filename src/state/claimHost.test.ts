import { describe, expect, it } from 'vitest'
import { createInitialState, DEMO_HOST_KEY } from './initialState'
import { roomReducer } from './roomReducer'
import { SELF_ID } from './types'
import type { RoomState } from './types'

const NOW = 1000
const hostOf = (s: RoomState) => s.participants.find((p) => p.role === 'Host')?.id
const withoutHost = () => roomReducer(createInitialState(), { type: 'vacateHost', now: NOW })

describe('vacateHost', () => {
  it('turns the user into a participant when they hold the host role', () => {
    const state = withoutHost()
    expect(hostOf(state)).toBeUndefined()
    expect(state.participants.find((p) => p.id === SELF_ID)?.role).toBe('Peserta')
    expect(state.notices.at(-1)?.text).toBe('Host meninggalkan meeting')
  })

  it('removes another person from the room when they are the host', () => {
    const handedOver = roomReducer(createInitialState(), { type: 'makeHost', id: 'dewi' })
    const state = roomReducer(handedOver, { type: 'vacateHost', now: NOW })
    expect(hostOf(state)).toBeUndefined()
    expect(state.participants.some((p) => p.id === 'dewi')).toBe(false)
    expect(state.bench.some((p) => p.id === 'dewi')).toBe(true)
  })

  it('does nothing when nobody is host', () => {
    const state = withoutHost()
    expect(roomReducer(state, { type: 'vacateHost', now: NOW })).toBe(state)
  })
})

describe('claimHost', () => {
  it('lets a participant claim the host role with the right key', () => {
    const state = roomReducer(withoutHost(), { type: 'claimHost', id: SELF_ID, key: DEMO_HOST_KEY, now: NOW })
    expect(hostOf(state)).toBe(SELF_ID)
    expect(state.notices.at(-1)?.text).toBe('Anda sekarang menjadi host')
  })

  it('rejects a wrong key', () => {
    const before = withoutHost()
    expect(roomReducer(before, { type: 'claimHost', id: SELF_ID, key: '000000', now: NOW })).toBe(before)
  })

  it('lets a co-host claim without a key', () => {
    const state = roomReducer(withoutHost(), { type: 'claimHost', id: 'dewi', key: '', now: NOW })
    expect(hostOf(state)).toBe('dewi')
  })

  it('refuses when a host already exists, so a late claimer cannot take over', () => {
    const before = createInitialState()
    expect(roomReducer(before, { type: 'claimHost', id: 'dewi', key: DEMO_HOST_KEY, now: NOW })).toBe(before)
  })

  it('refuses unknown participants', () => {
    const before = withoutHost()
    expect(roomReducer(before, { type: 'claimHost', id: 'ghost', key: DEMO_HOST_KEY, now: NOW })).toBe(before)
  })
})
