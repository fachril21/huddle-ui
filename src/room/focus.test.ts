import { describe, expect, it } from 'vitest'
import { resolveFocusId } from './focus'

const ids = ['anda', 'dewi', 'raka', 'bima']
const base = { mode: 'speaker', pinnedId: null, speakerId: null, selfId: 'anda' } as const

describe('resolveFocusId', () => {
  it('follows the active speaker', () => {
    expect(resolveFocusId(ids, { ...base, speakerId: 'raka' })).toBe('raka')
  })

  it('falls back to the first other person when nobody has spoken', () => {
    expect(resolveFocusId(ids, base)).toBe('dewi')
  })

  it('falls back when the speaker left the room', () => {
    expect(resolveFocusId(ids, { ...base, speakerId: 'ghost' })).toBe('dewi')
  })

  it('lets a pin win over the speaker in Sorotan', () => {
    expect(resolveFocusId(ids, { ...base, mode: 'spotlight', pinnedId: 'bima', speakerId: 'raka' })).toBe('bima')
  })

  it('ignores a pin in Pembicara', () => {
    expect(resolveFocusId(ids, { ...base, pinnedId: 'bima', speakerId: 'raka' })).toBe('raka')
  })

  it('follows the speaker when the pinned person is gone', () => {
    expect(resolveFocusId(ids, { ...base, mode: 'spotlight', pinnedId: 'ghost', speakerId: 'raka' })).toBe('raka')
  })

  it('uses the user when they are alone', () => {
    expect(resolveFocusId(['anda'], base)).toBe('anda')
  })
})
