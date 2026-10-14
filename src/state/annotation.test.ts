import { describe, expect, it } from 'vitest'
import { createInitialState } from './initialState'
import { roomReducer } from './roomReducer'
import { SELF_ID } from './types'
import type { RoomAction } from './actions'
import type { RoomState, Stroke } from './types'

const draft = (authorId: string, over: Partial<Omit<Stroke, 'id'>> = {}): Omit<Stroke, 'id'> => ({
  authorId,
  tool: 'pen',
  color: 'rose',
  points: [0.1, 0.1, 0.4, 0.4],
  startedAt: 0,
  durationMs: 0,
  fadeAfterMs: null,
  ...over,
})

const run = (state: RoomState, ...actions: RoomAction[]) => actions.reduce(roomReducer, state)
const sharing = () => run(createInitialState(), { type: 'startShare', id: 'raka' })

describe('annotationAdd', () => {
  it('ignores ink while nobody is sharing', () => {
    const state = run(createInitialState(), { type: 'annotationAdd', stroke: draft('dewi') })
    expect(state.annotation.strokes).toHaveLength(0)
  })

  it('stores strokes with increasing ids during a share', () => {
    const state = run(sharing(), { type: 'annotationAdd', stroke: draft('dewi') }, { type: 'annotationAdd', stroke: draft(SELF_ID) })
    expect(state.annotation.strokes.map((s) => s.id)).toEqual([1, 2])
  })

  it('blocks participants but not host or co-host when annotation is switched off', () => {
    const off = run(sharing(), { type: 'annotationAllow', on: false })
    expect(run(off, { type: 'annotationAdd', stroke: draft('bima') }).annotation.strokes).toHaveLength(0)
    expect(run(off, { type: 'annotationAdd', stroke: draft('dewi') }).annotation.strokes).toHaveLength(1)
    expect(run(off, { type: 'annotationAdd', stroke: draft(SELF_ID) }).annotation.strokes).toHaveLength(1)
  })
})

describe('erase, undo and clear', () => {
  const withInk = () =>
    run(sharing(), { type: 'annotationAdd', stroke: draft('bima') }, { type: 'annotationAdd', stroke: draft('sari') }, { type: 'annotationAdd', stroke: draft('bima') })

  it('lets a participant erase only their own stroke', () => {
    expect(run(withInk(), { type: 'annotationErase', id: 2, byId: 'bima' }).annotation.strokes).toHaveLength(3)
    expect(run(withInk(), { type: 'annotationErase', id: 1, byId: 'bima' }).annotation.strokes).toHaveLength(2)
  })

  it('lets the host erase anyone', () => {
    expect(run(withInk(), { type: 'annotationErase', id: 2, byId: SELF_ID }).annotation.strokes).toHaveLength(2)
  })

  it('undoes the latest stroke of the requester', () => {
    const state = run(withInk(), { type: 'annotationUndo', byId: 'bima' })
    expect(state.annotation.strokes.map((s) => s.id)).toEqual([1, 2])
  })

  it('clears only own ink for participants and everything for the host', () => {
    expect(run(withInk(), { type: 'annotationClear', byId: 'bima' }).annotation.strokes.map((s) => s.authorId)).toEqual(['sari'])
    expect(run(withInk(), { type: 'annotationClear', byId: SELF_ID }).annotation.strokes).toHaveLength(0)
  })
})

describe('lifecycle', () => {
  it('removes all ink when the share stops', () => {
    const state = run(sharing(), { type: 'annotationAdd', stroke: draft('dewi') }, { type: 'stopShare' })
    expect(state.annotation.strokes).toHaveLength(0)
  })

  it('removes all ink when the sharer leaves the room', () => {
    const state = run(sharing(), { type: 'annotationAdd', stroke: draft('dewi') }, { type: 'removeParticipant', id: 'raka', now: 1 })
    expect(state.sharerId).toBeNull()
    expect(state.annotation.strokes).toHaveLength(0)
  })

  it('expires only faded strokes', () => {
    const state = run(
      sharing(),
      { type: 'annotationAdd', stroke: draft('dewi', { tool: 'laser', fadeAfterMs: 500 }) },
      { type: 'annotationAdd', stroke: draft('dewi') },
      { type: 'annotationExpire', now: 5000 },
    )
    expect(state.annotation.strokes.map((s) => s.id)).toEqual([2])
  })

  it('keeps the allow switch across a share restart', () => {
    const state = run(sharing(), { type: 'annotationAllow', on: false }, { type: 'stopShare' })
    expect(state.annotation.allowed).toBe(false)
  })
})
