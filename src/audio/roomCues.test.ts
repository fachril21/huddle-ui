import { describe, expect, it } from 'vitest'
import { createInitialState } from '../state/initialState'
import { roomReducer } from '../state/roomReducer'
import { SELF_ID } from '../state/types'
import type { RoomState } from '../state/types'
import { deriveCues } from './roomCues'

const NOW = 1000
const base = (): RoomState => createInitialState()

describe('deriveCues', () => {
  it('returns nothing when the state did not change', () => {
    const state = base()
    expect(deriveCues(state, state)).toEqual([])
  })

  it('plays mic mute and unmute for the user only', () => {
    const muted = roomReducer(base(), { type: 'toggleMic', id: SELF_ID })
    expect(deriveCues(base(), muted)).toEqual(['micMute'])
    expect(deriveCues(muted, roomReducer(muted, { type: 'toggleMic', id: SELF_ID }))).toEqual(['micUnmute'])
    expect(deriveCues(base(), roomReducer(base(), { type: 'toggleMic', id: 'dewi' }))).toEqual([])
  })

  it('plays the raise-hand cue when a hand goes up but not when it goes down', () => {
    const raised = roomReducer(base(), { type: 'toggleHand', id: 'sari' })
    expect(deriveCues(base(), raised)).toEqual(['raiseHand'])
    expect(deriveCues(raised, roomReducer(raised, { type: 'toggleHand', id: 'sari' }))).toEqual([])
  })

  it('plays share start and stop', () => {
    const sharing = roomReducer(base(), { type: 'startShare', id: 'raka' })
    expect(deriveCues(base(), sharing)).toEqual(['shareStart'])
    expect(deriveCues(sharing, roomReducer(sharing, { type: 'stopShare' }))).toEqual(['shareStop'])
  })

  it('plays incoming chat for public and private messages from others, not for own or private-to-others', () => {
    const send = (fromId: string, toId: string | null) => roomReducer(base(), { type: 'chatSend', fromId, toId, text: 'hai', now: NOW })
    expect(deriveCues(base(), send('raka', null))).toEqual(['incomingChat'])
    expect(deriveCues(base(), send('raka', SELF_ID))).toEqual(['incomingChat'])
    expect(deriveCues(base(), send(SELF_ID, null))).toEqual([])
    expect(deriveCues(base(), send('raka', 'bima'))).toEqual([])
  })

  it('plays enter and leave when other people join or are removed', () => {
    const more = roomReducer(base(), { type: 'setCount', count: 12 })
    expect(deriveCues(base(), more)).toEqual(['enterRoom'])
    expect(deriveCues(more, roomReducer(more, { type: 'setCount', count: 4 }))).toEqual(['leaveRoom'])
    expect(deriveCues(base(), roomReducer(base(), { type: 'removeParticipant', id: 'raka', now: NOW }))).toEqual(['leaveRoom'])
  })

  it('plays leave when the user leaves and enter when the demo restarts', () => {
    const left = roomReducer(base(), { type: 'leave', phase: 'left' })
    expect(deriveCues(base(), left)).toEqual(['leaveRoom'])
    expect(deriveCues(left, roomReducer(left, { type: 'reset' }))).toEqual(['enterRoom'])
  })

  it('plays the unstable-connection cue only when the user connection degrades', () => {
    const poor = roomReducer(base(), { type: 'toggleConnection', id: SELF_ID, connection: 'poor' })
    expect(deriveCues(base(), poor)).toEqual(['connectionUnstable'])
    expect(deriveCues(poor, roomReducer(poor, { type: 'toggleConnection', id: SELF_ID, connection: 'poor' }))).toEqual([])
    expect(deriveCues(base(), roomReducer(base(), { type: 'toggleConnection', id: 'dewi', connection: 'poor' }))).toEqual([])
  })
})
