import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES, parsePreferences } from './preferences'

describe('parsePreferences', () => {
  it('falls back to the defaults for nothing, junk or the wrong shape', () => {
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES)
    expect(parsePreferences('not json')).toEqual(DEFAULT_PREFERENCES)
    expect(parsePreferences('[1,2]')).toEqual(DEFAULT_PREFERENCES)
  })

  it('keeps valid fields and drops only the invalid ones', () => {
    const got = parsePreferences(JSON.stringify({ fx: 'lite', cameraId: 'cam-1', micId: 42, notifySounds: false, expiryReminder: 'yes' }))
    expect(got.fx).toBe('lite')
    expect(got.cameraId).toBe('cam-1')
    expect(got.micId).toBe('')
    expect(got.notifySounds).toBe(false)
    expect(got.expiryReminder).toBe(true)
  })

  it('ignores an effects tier it does not know', () => {
    expect(parsePreferences(JSON.stringify({ fx: 'ultra' })).fx).toBeNull()
  })

  it('remembers the background and falls back to none for anything else', () => {
    expect(parsePreferences(JSON.stringify({ background: { mode: 'blur', level: 3 } })).background).toEqual({ mode: 'blur', level: 3 })
    expect(parsePreferences(JSON.stringify({ background: { mode: 'image', id: 'kafe' } })).background).toEqual({ mode: 'image', id: 'kafe' })
    expect(parsePreferences(JSON.stringify({ background: 'blur' })).background).toEqual({ mode: 'none' })
    expect(parsePreferences(JSON.stringify({ cameraId: 'x' })).background).toEqual({ mode: 'none' })
  })
})
