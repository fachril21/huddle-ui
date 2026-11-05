import { describe, expect, it } from 'vitest'
import type { Participant } from '../state/types'
import { pickMiniRoster } from './miniRoster'
import { getPipApi, pipSupported } from './pipSupport'

function person(id: string, patch: Partial<Participant> = {}): Participant {
  return { id, name: id, role: 'Peserta', palette: 'borealis', camOn: false, micOn: true, hand: null, status: 'none', connection: 'good', ...patch }
}

describe('pickMiniRoster', () => {
  it('puts people who are speaking first, then raised hands in queue order, then cameras on', () => {
    const people = [person('a'), person('b', { camOn: true }), person('c', { hand: 2 }), person('d', { hand: 1 }), person('e')]
    const { shown } = pickMiniRoster(people, new Set(['e']))
    expect(shown.map((p) => p.id)).toEqual(['e', 'd', 'c', 'b', 'a'])
  })

  it('keeps the room order between equals', () => {
    const people = [person('a'), person('b'), person('c')]
    expect(pickMiniRoster(people, new Set()).shown.map((p) => p.id)).toEqual(['a', 'b', 'c'])
  })

  it('shows everyone when they fit and folds the overflow into one "+N" cell otherwise', () => {
    const people = Array.from({ length: 8 }, (_, i) => person(`p${i}`))
    expect(pickMiniRoster(people.slice(0, 6), new Set())).toMatchObject({ hidden: 0 })
    const folded = pickMiniRoster(people, new Set(), 6)
    expect(folded.shown).toHaveLength(5)
    expect(folded.hidden).toBe(3)
  })

  it('does not change the list it was given', () => {
    const people = [person('a'), person('b', { hand: 1 })]
    pickMiniRoster(people, new Set())
    expect(people.map((p) => p.id)).toEqual(['a', 'b'])
  })
})

describe('pipSupported', () => {
  it('is false where the browser has no Document Picture-in-Picture', () => {
    expect(pipSupported({})).toBe(false)
    expect(getPipApi({ documentPictureInPicture: {} })).toBeNull()
  })

  it('is true when requestWindow exists', () => {
    const api = { window: null, requestWindow: async () => ({}) as Window }
    expect(pipSupported({ documentPictureInPicture: api })).toBe(true)
  })
})
