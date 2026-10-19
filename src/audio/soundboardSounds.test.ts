import { describe, expect, it } from 'vitest'
import { SOUNDBOARD_DATA } from './soundboardData'
import { SOUNDS, SOUND_BY_ID } from './soundboardSounds'

describe('soundboard sounds', () => {
  it('keeps the twelve ids and each one is at most 5 seconds', () => {
    expect(SOUNDS).toHaveLength(12)
    expect(new Set(SOUNDS.map((s) => s.id)).size).toBe(12)
    for (const s of SOUNDS) expect(s.durationMs).toBeLessThanOrEqual(5000)
  })

  it('has an audio file for every sound and none left over', () => {
    expect(Object.keys(SOUNDBOARD_DATA).sort()).toEqual(SOUNDS.map((s) => s.id).sort())
    for (const data of Object.values(SOUNDBOARD_DATA)) expect(data.startsWith('data:audio/mpeg')).toBe(true)
  })

  it('looks sounds up by id', () => {
    expect(SOUND_BY_ID.horn.loud).toBe(true)
  })
})
