import { describe, expect, it } from 'vitest'
import type { Participant } from '../state/types'
import { awayClock, awayRecipients, awaySentence, spanText } from './presence'

const MIN = 60_000
const person = (over: Partial<Participant>): Participant => ({
  id: 'dewi',
  name: 'Dewi',
  role: 'Peserta',
  palette: 'nebula',
  camOn: true,
  micOn: true,
  hand: null,
  status: 'none',
  connection: 'good',
  ...over,
})
const brb = (backMin: number | null) => person({ status: 'brb', away: { since: 0, backAt: backMin === null ? null : backMin * MIN, before: null } })
const afk = person({ status: 'afk', away: { since: 0, backAt: null, before: null } })

describe('spanText', () => {
  it('says baru saja under a minute, then minutes, then hours', () => {
    expect(spanText(30_000)).toBe('baru saja')
    expect(spanText(4 * MIN + 5000)).toBe('4 mnt')
    expect(spanText(65 * MIN)).toBe('1 j 5 mnt')
    expect(spanText(120 * MIN)).toBe('2 j')
  })
})

describe('awayClock', () => {
  it('counts down a BRB with an estimate, then reports the overrun', () => {
    expect(awayClock(brb(5), 2 * MIN)).toBe('3 mnt lagi')
    expect(awayClock(brb(5), 5 * MIN - 20_000)).toBe('sebentar lagi')
    expect(awayClock(brb(5), 5 * MIN + 30_000)).toBe('sebentar lagi')
    expect(awayClock(brb(5), 8 * MIN)).toBe('lewat 3 mnt')
  })
  it('counts up an AFK or a BRB without an estimate', () => {
    expect(awayClock(afk, 6 * MIN)).toBe('6 mnt')
    expect(awayClock(brb(null), 2 * MIN)).toBe('2 mnt')
  })
})

describe('awaySentence', () => {
  it('reads as a sentence', () => {
    expect(awaySentence(brb(5), 2 * MIN)).toBe('BRB, kembali 3 mnt lagi')
    expect(awaySentence(afk, 6 * MIN)).toBe('AFK, pergi 6 mnt')
    expect(awaySentence(person({}), MIN)).toBe('')
  })
})

describe('awayRecipients', () => {
  const people = [afk, person({ id: 'raka', name: 'Raka' }), person({ id: 'bima', name: 'Bima', status: 'brb', away: { since: 0, backAt: null, before: null } })]
  it('picks the private recipient and the @mentioned who are away', () => {
    expect(awayRecipients(people, 'dewi', 'halo')).toEqual(['dewi'])
    expect(awayRecipients(people, null, 'tolong @Bima dan @dewi cek ini')).toEqual(['dewi', 'bima'])
  })
  it('ignores people who are here and name prefixes', () => {
    expect(awayRecipients(people, null, '@Raka @Bimas')).toEqual([])
  })
})
