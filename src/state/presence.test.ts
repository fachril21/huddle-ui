import { describe, expect, it } from 'vitest'
import type { RoomAction } from './actions'
import { createInitialState } from './initialState'
import { roomReducer } from './roomReducer'
import { SELF_ID } from './types'
import type { RoomState } from './types'

const run = (state: RoomState, ...actions: RoomAction[]) => actions.reduce(roomReducer, state)
const find = (state: RoomState, id: string) => state.participants.find((p) => p.id === id)!
const T0 = 1000
const MIN = 60_000
const away = (status: 'brb' | 'afk', over: Partial<Extract<RoomAction, { type: 'setPresence' }>> = {}): RoomAction => ({ type: 'setPresence', id: SELF_ID, status, now: T0, ...over })

describe('stepping away', () => {
  it('marks since when, and when they said they would be back', () => {
    const me = find(run(createInitialState(), away('brb', { minutes: 5 })), SELF_ID)
    expect(me.status).toBe('brb')
    expect(me.away).toMatchObject({ since: T0, backAt: T0 + 5 * MIN })
  })

  it('leaves mic and camera alone unless asked, and gives them back when it is', () => {
    const start = createInitialState()
    const was = find(start, SELF_ID)
    const quiet = find(run(start, away('afk', { quiet: true })), SELF_ID)
    expect(quiet.micOn).toBe(false)
    expect(quiet.camOn).toBe(false)
    expect(find(run(start, away('afk')), SELF_ID).micOn).toBe(was.micOn)
    const home = find(run(start, away('afk', { quiet: true }), { type: 'setPresence', id: SELF_ID, status: 'none', now: T0 + MIN }), SELF_ID)
    expect(home).toMatchObject({ status: 'none', micOn: was.micOn, camOn: was.camOn })
    expect(home.away).toBeUndefined()
  })

  it('keeps the original time and devices when switching between BRB and AFK', () => {
    const state = run(createInitialState(), away('brb', { minutes: 5, quiet: true }), away('afk', { now: T0 + 3 * MIN, quiet: true }))
    const me = find(state, SELF_ID)
    expect(me.status).toBe('afk')
    expect(me.away).toMatchObject({ since: T0, backAt: null })
    expect(me.away?.before).toEqual({ micOn: find(createInitialState(), SELF_ID).micOn, camOn: find(createInitialState(), SELF_ID).camOn })
  })
})

describe('coming back', () => {
  it('turning the mic on counts as being back, and keeps it on', () => {
    const me = find(run(createInitialState(), away('brb', { quiet: true }), { type: 'toggleMic', id: SELF_ID }), SELF_ID)
    expect(me.status).toBe('none')
    expect(me.micOn).toBe(true)
  })

  it('turning the mic off while away is not coming back', () => {
    const me = find(run(createInitialState(), away('brb'), { type: 'setMic', id: SELF_ID, on: false }), SELF_ID)
    expect(me.status).toBe('brb')
  })
})

describe('a message for someone who is away', () => {
  it('remembers who was away when it was sent', () => {
    const state = run(createInitialState(), { type: 'setPresence', id: 'raka', status: 'afk', now: T0 }, { type: 'chatSend', fromId: SELF_ID, toId: null, text: 'tolong @Raka cek ini', now: T0 })
    expect(state.chat.messages.at(-1)?.awayIds).toEqual(['raka'])
  })

  it('adds nothing when everyone is here', () => {
    const state = run(createInitialState(), { type: 'chatSend', fromId: SELF_ID, toId: 'raka', text: 'halo', now: T0 })
    expect(state.chat.messages.at(-1)?.awayIds).toBeUndefined()
  })
})
