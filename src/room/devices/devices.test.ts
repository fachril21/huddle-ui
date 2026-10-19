import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../state/initialState'
import { roomReducer } from '../../state/roomReducer'
import type { RoomAction } from '../../state/actions'
import type { RoomState } from '../../state/types'
import { DEFAULT_DEVICES, flipFacing, isMissing, withDevice } from './deviceSettings'

const run = (state: RoomState, ...actions: RoomAction[]) => actions.reduce(roomReducer, state)

describe('withDevice', () => {
  it('changes only the kind that was picked', () => {
    const next = withDevice(DEFAULT_DEVICES, 'mic', 'mic-2')
    expect(next).toEqual({ ...DEFAULT_DEVICES, micId: 'mic-2' })
    expect(next.cameraId).toBe('')
    expect(next.speakerId).toBe('')
  })

  it('returns the same object when nothing changes', () => {
    expect(withDevice(DEFAULT_DEVICES, 'camera', '')).toBe(DEFAULT_DEVICES)
  })
})

describe('flipFacing', () => {
  it('toggles front and back and forgets a specific camera pick', () => {
    const picked = withDevice(DEFAULT_DEVICES, 'camera', 'cam-2')
    const flipped = flipFacing(picked)
    expect(flipped.facing).toBe('environment')
    expect(flipped.cameraId).toBe('')
    expect(flipFacing(flipped).facing).toBe('user')
  })
})

describe('isMissing', () => {
  const list = [{ id: 'a' }, { id: 'b' }]

  it('is false for the system default', () => {
    expect(isMissing('', list)).toBe(false)
  })

  it('is false while the browser has not listed devices yet', () => {
    expect(isMissing('a', [])).toBe(false)
  })

  it('is true once a chosen device is gone from a non-empty list', () => {
    expect(isMissing('c', list)).toBe(true)
    expect(isMissing('b', list)).toBe(false)
  })
})

describe('device actions', () => {
  it('stores the picked device in settings', () => {
    const state = run(createInitialState(), { type: 'setDevice', kind: 'speaker', id: 'spk-1' })
    expect(state.settings.devices.speakerId).toBe('spk-1')
  })

  it('flips the camera through the reducer', () => {
    const state = run(createInitialState(), { type: 'setDevice', kind: 'camera', id: 'cam-2' }, { type: 'flipCamera' })
    expect(state.settings.devices).toMatchObject({ cameraId: '', facing: 'environment' })
  })

  it('starts the room on the devices chosen in the lobby', () => {
    const devices = { cameraId: 'c', micId: 'm', speakerId: 's', facing: 'environment' as const }
    const state = run(createInitialState(), { type: 'joinRoom', name: 'Sari', micOn: true, camOn: true, quality: 'mid', devices })
    expect(state.settings.devices).toEqual(devices)
  })

  it('keeps the chosen devices through "Mulai ulang demo"', () => {
    const state = run(createInitialState(), { type: 'setDevice', kind: 'mic', id: 'mic-9' }, { type: 'reset' })
    expect(state.settings.devices.micId).toBe('mic-9')
  })

  it('shares the popover slot: opening mic settings closes the camera menu', () => {
    const state = run(createInitialState(), { type: 'toggleDock', key: 'camera' }, { type: 'toggleDock', key: 'mic' })
    expect(state.toggles.mic).toBe(true)
    expect(state.toggles.camera).toBe(false)
  })

  it('closes mic settings when the user leaves', () => {
    const state = run(createInitialState(), { type: 'toggleDock', key: 'mic' }, { type: 'leave', phase: 'left' })
    expect(state.toggles.mic).toBe(false)
  })
})
