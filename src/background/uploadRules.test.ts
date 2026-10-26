import { describe, expect, it } from 'vitest'
import { MAX_UPLOAD_BYTES, checkUpload, coverRect, fitWidth } from './uploadRules'

describe('checkUpload', () => {
  it('accepts the three image types within the size limit', () => {
    expect(checkUpload({ type: 'image/jpeg', size: 1000 })).toBeNull()
    expect(checkUpload({ type: 'image/png', size: MAX_UPLOAD_BYTES })).toBeNull()
    expect(checkUpload({ type: 'image/webp', size: 1 })).toBeNull()
  })

  it('names the first problem', () => {
    expect(checkUpload({ type: 'image/gif', size: 10 })).toBe('type')
    expect(checkUpload({ type: 'application/pdf', size: MAX_UPLOAD_BYTES + 1 })).toBe('type')
    expect(checkUpload({ type: 'image/png', size: MAX_UPLOAD_BYTES + 1 })).toBe('size')
    expect(checkUpload({ type: 'image/png', size: 0 })).toBe('unreadable')
  })
})

describe('fitWidth', () => {
  it('never enlarges', () => {
    expect(fitWidth(800, 600)).toEqual({ width: 800, height: 600 })
  })

  it('shrinks to the width limit and keeps the proportions', () => {
    expect(fitWidth(3840, 2160)).toEqual({ width: 1920, height: 1080 })
    expect(fitWidth(4000, 1, 1920).height).toBe(1)
  })
})

describe('coverRect', () => {
  it('crops the sides of a wider picture', () => {
    expect(coverRect(2000, 1000, 1000, 1000)).toEqual({ sx: 500, sy: 0, sw: 1000, sh: 1000 })
  })

  it('crops top and bottom of a taller picture', () => {
    expect(coverRect(1000, 2000, 1600, 900)).toEqual({ sx: 0, sy: 718.75, sw: 1000, sh: 562.5 })
  })

  it('takes everything when the proportions match', () => {
    expect(coverRect(1600, 900, 800, 450)).toEqual({ sx: 0, sy: 0, sw: 1600, sh: 900 })
  })
})
