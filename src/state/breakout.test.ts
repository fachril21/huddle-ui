import { describe, expect, it } from 'vitest'
import { deriveCues } from '../audio/roomCues'
import { CLOSING_MS, scopedState, unplacedIds } from '../breakout/rooms'
import type { RoomAction } from './actions'
import { DEFAULT_BREAKOUT_OPTIONS, createInitialState } from './initialState'
import { roomReducer } from './roomReducer'
import { SELF_ID } from './types'
import type { BreakoutMode, BreakoutOptions, RoomState } from './types'

const run = (state: RoomState, ...actions: RoomAction[]) => actions.reduce(roomReducer, state)
const create = (count = 2, mode: BreakoutMode = 'auto', options: Partial<BreakoutOptions> = {}): RoomAction => ({ type: 'breakoutCreate', count, mode, options: { ...DEFAULT_BREAKOUT_OPTIONS, ...options } })
const NOW = 10_000
const open = (state: RoomState) => roomReducer(state, { type: 'breakoutOpen', now: NOW })
const join = (id: string, roomId: string): RoomAction => ({ type: 'breakoutJoin', id, roomId, now: NOW })

describe('creating rooms', () => {
  it('spreads people evenly and leaves hosts out', () => {
    const state = run(createInitialState(), create(3))
    const sizes = state.breakout.rooms.map((r) => Object.values(state.breakout.assignment).filter((v) => v === r.id).length)
    // 8 people, 2 of them hosts (Anda, Dewi): 6 spread over 3 rooms
    expect(sizes).toEqual([2, 2, 2])
    expect(state.breakout.assignment[SELF_ID]).toBeUndefined()
    expect(state.breakout.phase).toBe('prepared')
  })

  it('places nobody for manual and choice modes, and clamps the room count', () => {
    expect(run(createInitialState(), create(4, 'manual')).breakout.assignment).toEqual({})
    expect(run(createInitialState(), create(40)).breakout.rooms).toHaveLength(8)
    expect(run(createInitialState(), create(0)).breakout.rooms).toHaveLength(2)
  })

  it('keeps rooms closed until they are opened', () => {
    const state = run(createInitialState(), create(2))
    expect(Object.keys(state.breakout.where)).toEqual([])
    expect(scopedState(state)).toBe(state)
  })
})

describe('placing people', () => {
  it('moves someone who is already in a room, but only invites someone in the main room', () => {
    let state = run(createInitialState(), create(2, 'manual'), { type: 'breakoutAssign', id: 'raka', roomId: 'r1', now: NOW })
    state = open(state)
    expect(state.breakout.where.raka).toBeUndefined()
    state = run(state, join('raka', 'r1'), { type: 'breakoutAssign', id: 'raka', roomId: 'r2', now: NOW })
    expect(state.breakout.where.raka).toBe('r2')
  })

  it('moves assigned people in at once with auto-move on, hosts excepted', () => {
    const state = open(run(createInitialState(), create(2, 'auto', { autoMove: true })))
    expect(state.breakout.where.raka).toBeTruthy()
    expect(state.breakout.where[SELF_ID]).toBeUndefined()
  })

  it('lets only chosen people into a room unless everyone may choose', () => {
    let state = open(run(createInitialState(), create(2, 'manual'), { type: 'breakoutAssign', id: 'raka', roomId: 'r1', now: NOW }))
    state = run(state, join('raka', 'r2'), join('bima', 'r1'))
    expect(state.breakout.where.raka).toBeUndefined()
    expect(state.breakout.where.bima).toBeUndefined()
    const choice = open(run(createInitialState(), create(2, 'choice')))
    expect(roomReducer(choice, join('bima', 'r2')).breakout.where.bima).toBe('r2')
  })

  it('does not let people leave when returning is switched off, until the rooms are closing', () => {
    let state = open(run(createInitialState(), create(2, 'choice', { allowReturn: false })))
    state = run(state, join('raka', 'r1'), { type: 'breakoutLeave', id: 'raka', now: NOW })
    expect(state.breakout.where.raka).toBe('r1')
    state = run(state, { type: 'breakoutClose', now: NOW }, { type: 'breakoutLeave', id: 'raka', now: NOW })
    expect(state.breakout.where.raka).toBeUndefined()
  })

  it('does not delete a room that someone is placed in', () => {
    const state = run(createInitialState(), create(3), { type: 'breakoutRemoveRoom', roomId: 'r1' })
    expect(state.breakout.rooms).toHaveLength(3)
    const empty = run(createInitialState(), create(3, 'manual'), { type: 'breakoutRemoveRoom', roomId: 'r3' })
    expect(empty.breakout.rooms.map((r) => r.id)).toEqual(['r1', 'r2'])
  })
})

describe('closing', () => {
  it('counts down 60 seconds, then brings everyone back and keeps the placements', () => {
    let state = open(run(createInitialState(), create(2, 'auto', { autoMove: true })))
    state = roomReducer(state, { type: 'breakoutClose', now: NOW })
    expect(state.breakout.phase).toBe('closing')
    expect(roomReducer(state, { type: 'breakoutTick', now: NOW + CLOSING_MS - 1 }).breakout.phase).toBe('closing')
    const done = roomReducer(state, { type: 'breakoutTick', now: NOW + CLOSING_MS })
    expect(done.breakout.phase).toBe('prepared')
    expect(done.breakout.where).toEqual({})
    expect(done.breakout.assignment.raka).toBeTruthy()
  })

  it('starts the countdown by itself when the timer runs out', () => {
    const state = open(run(createInitialState(), create(2, 'auto', { autoCloseMin: 5 })))
    expect(state.breakout.closesAt).toBe(NOW + 300_000)
    expect(roomReducer(state, { type: 'breakoutTick', now: NOW + 299_999 }).breakout.phase).toBe('open')
    expect(roomReducer(state, { type: 'breakoutTick', now: NOW + 300_000 }).breakout.phase).toBe('closing')
  })

  it('can close at once', () => {
    const state = run(open(run(createInitialState(), create(2, 'auto', { autoMove: true }))), { type: 'breakoutClose', now: NOW, immediate: true })
    expect(state.breakout.phase).toBe('prepared')
  })

  it('closes everything when nobody is host any more', () => {
    const state = run(open(run(createInitialState(), create(2))), { type: 'vacateHost', now: NOW })
    expect(state.breakout.phase).toBe('prepared')
  })

  it('forgets people who leave the meeting', () => {
    const state = run(createInitialState(), create(2), { type: 'removeParticipant', id: 'raka', now: NOW })
    expect(state.breakout.assignment.raka).toBeUndefined()
  })
})

describe('what a room can see', () => {
  const inRooms = () => run(createInitialState(), create(2, 'auto', { autoMove: true }), { type: 'breakoutOpen', now: NOW })

  it('shows only the people in your own room, and the others by name on the bench', () => {
    const joined = roomReducer(inRooms(), join(SELF_ID, 'r1'))
    const view = scopedState(joined)
    const here = new Set(view.participants.map((p) => p.id))
    expect(here.has(SELF_ID)).toBe(true)
    for (const p of joined.participants) expect(here.has(p.id)).toBe(joined.breakout.where[p.id] === 'r1')
    expect(view.bench.length).toBe(joined.bench.length + (joined.participants.length - view.participants.length))
  })

  it('keeps chat to the room it was said in, but private messages travel', () => {
    let state = roomReducer(inRooms(), join(SELF_ID, 'r1'))
    state = run(state, { type: 'chatSend', fromId: SELF_ID, toId: null, text: 'di ruang 1', now: NOW }, { type: 'chatSend', fromId: 'raka', toId: SELF_ID, text: 'bisik', now: NOW })
    const texts = scopedState(roomReducer(state, { type: 'breakoutLeave', id: SELF_ID, now: NOW })).chat.messages.map((m) => m.text)
    expect(texts).not.toContain('di ruang 1')
    expect(texts).toContain('bisik')
  })

  it('hides polls inside a room and shows the host broadcast as its announcement', () => {
    let state = roomReducer(inRooms(), { type: 'breakoutBroadcast', fromId: SELF_ID, text: 'Sepuluh menit lagi', now: NOW })
    state = roomReducer(state, join(SELF_ID, 'r2'))
    const view = scopedState(state)
    expect(view.polls).toEqual([])
    expect(view.host.announcement?.text).toBe('Sepuluh menit lagi')
    expect(scopedState(roomReducer(state, { type: 'dismissAnnouncement' })).host.announcement).toBeNull()
  })

  it('counts late arrivals as unplaced', () => {
    const state = run(createInitialState(), create(2), { type: 'setCount', count: 12 })
    expect(unplacedIds(state).length).toBeGreaterThan(0)
  })
})

describe('breakout cues', () => {
  it('stays quiet while people walk between rooms, and rings for help only for managers', () => {
    const state = open(run(createInitialState(), create(2, 'choice')))
    const moved = roomReducer(state, join('raka', 'r1'))
    expect(deriveCues(scopedState(state), scopedState(moved))).toEqual([])
    const asked = roomReducer(moved, { type: 'breakoutHelp', id: 'raka', now: NOW })
    expect(deriveCues(scopedState(moved), scopedState(asked))).toEqual(['raiseHand'])
    const asPeserta = roomReducer(moved, { type: 'setRole', id: SELF_ID, role: 'Peserta' })
    const askedAsPeserta = roomReducer(asPeserta, { type: 'breakoutHelp', id: 'raka', now: NOW })
    expect(deriveCues(scopedState(asPeserta), scopedState(askedAsPeserta))).toEqual([])
  })
})
