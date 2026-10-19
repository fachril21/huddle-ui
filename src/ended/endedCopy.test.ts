import { describe, expect, it } from 'vitest'
import { durationLabel, endCopy } from './endedCopy'

const facts = { hostName: 'Dewi', selfIsHost: false, othersInRoom: 0 }

describe('durationLabel', () => {
  it('says minutes, then hours and minutes', () => {
    expect(durationLabel(20_000)).toBe('kurang dari 1 mnt')
    expect(durationLabel(42 * 60_000 + 5_000)).toBe('42 mnt')
    expect(durationLabel(60 * 60_000)).toBe('1 j')
    expect(durationLabel(125 * 60_000)).toBe('2 j 5 mnt')
    expect(durationLabel(-5)).toBe('kurang dari 1 mnt')
  })
})

describe('endCopy', () => {
  it('tells someone who left whether the meeting goes on', () => {
    expect(endCopy('left', { ...facts, othersInRoom: 3 }).body).toContain('3 peserta')
    expect(endCopy('left', facts).body).toContain('kosong')
  })

  it('names who ended the meeting', () => {
    expect(endCopy('ended', facts).title).toBe('Host mengakhiri rapat untuk semua')
    expect(endCopy('ended', facts).body).toContain('Dewi')
    expect(endCopy('ended', { ...facts, selfIsHost: true }).title).toBe('Anda mengakhiri rapat untuk semua')
  })

  it('does not promise a way back in when the host removed you', () => {
    const { title, body } = endCopy('removed', facts)
    expect(title).toContain('mengeluarkan')
    expect(body).toContain('Dewi')
  })
})
