import { describe, expect, it } from 'vitest'
import { deriveCues } from '../audio/roomCues'
import { createInitialState } from './initialState'
import { roomReducer } from './roomReducer'
import type { Guest } from './types'

const budi: Guest = { id: 'guest-1', name: 'Budi', at: 1000 }
const citra: Guest = { id: 'guest-2', name: 'Citra', at: 2000 }

const withGuests = (...guests: Guest[]) => guests.reduce((s, guest) => roomReducer(s, { type: 'guestRequest', guest }), createInitialState())

describe('host waiting room', () => {
  it('queues guests in order and ignores a repeated request', () => {
    const state = roomReducer(withGuests(budi, citra), { type: 'guestRequest', guest: budi })
    expect(state.host.waiting.map((g) => g.name)).toEqual(['Budi', 'Citra'])
  })

  it('removes one guest and says what happened', () => {
    const state = roomReducer(withGuests(budi, citra), { type: 'guestDecide', id: 'guest-1', admit: true, now: 5000 })
    expect(state.host.waiting.map((g) => g.id)).toEqual(['guest-2'])
    expect(state.notices.at(-1)?.text).toBe('Budi diizinkan masuk')
    expect(roomReducer(withGuests(budi), { type: 'guestDecide', id: 'guest-1', admit: false, now: 5000 }).notices.at(-1)?.text).toBe('Budi ditolak')
  })

  it('admits everyone at once with a single notice', () => {
    const state = roomReducer(withGuests(budi, citra), { type: 'guestAdmitAll', now: 5000 })
    expect(state.host.waiting).toEqual([])
    expect(state.notices.at(-1)?.text).toBe('2 tamu diizinkan masuk')
  })

  it('does nothing when nobody is waiting', () => {
    const state = createInitialState()
    expect(roomReducer(state, { type: 'guestAdmitAll', now: 5000 })).toBe(state)
  })

  it('lets the queue in when the waiting room is switched off, and lets new guests walk in', () => {
    const off = roomReducer(withGuests(budi, citra), { type: 'hostWaitingRoom', on: false, now: 5000 })
    expect(off.host.waitingRoom).toBe(false)
    expect(off.host.waiting).toEqual([])
    const late = roomReducer(off, { type: 'guestRequest', guest: { id: 'guest-3', name: 'Hadi', at: 6000 } })
    expect(late.host.waiting).toEqual([])
    expect(late.notices.at(-1)?.text).toBe('Hadi bergabung')
  })

  it('keeps the queue when the waiting room is switched on again', () => {
    const state = withGuests(budi)
    expect(roomReducer(state, { type: 'hostWaitingRoom', on: true, now: 5000 })).toBe(state)
  })
})

describe('waiting room cue', () => {
  it('rings for a new guest only when the user can answer the door', () => {
    const before = createInitialState()
    expect(deriveCues(before, withGuests(budi))).toEqual(['incomingChat'])
    expect(deriveCues(withGuests(budi), roomReducer(withGuests(budi), { type: 'guestDecide', id: 'guest-1', admit: true, now: 5000 }))).toEqual([])
    const asPeserta = roomReducer(before, { type: 'setRole', id: 'anda', role: 'Peserta' })
    expect(deriveCues(asPeserta, roomReducer(asPeserta, { type: 'guestRequest', guest: budi }))).toEqual([])
  })
})
