import { describe, expect, it } from 'vitest'
import {
  BACKGROUND_IMAGES,
  CUSTOM_BACKGROUND_ID,
  NO_BACKGROUND,
  backgroundKey,
  blurRadius,
  describeBackground,
  imageSources,
  parseBackground,
  resolveBackground,
  sameBackground,
} from './backgrounds'

describe('parseBackground', () => {
  it('reads the three modes', () => {
    expect(parseBackground({ mode: 'none' })).toEqual(NO_BACKGROUND)
    expect(parseBackground({ mode: 'blur', level: 3 })).toEqual({ mode: 'blur', level: 3 })
    expect(parseBackground({ mode: 'image', id: 'kafe' })).toEqual({ mode: 'image', id: 'kafe' })
  })

  it('keeps the upload id even though it is not in the list', () => {
    expect(parseBackground({ mode: 'image', id: CUSTOM_BACKGROUND_ID })).toEqual({ mode: 'image', id: CUSTOM_BACKGROUND_ID })
  })

  it('treats junk as no effect and a bad blur level as the middle one', () => {
    expect(parseBackground(null)).toEqual(NO_BACKGROUND)
    expect(parseBackground('blur')).toEqual(NO_BACKGROUND)
    expect(parseBackground({ mode: 'image', id: 'tidak-ada' })).toEqual(NO_BACKGROUND)
    expect(parseBackground({ mode: 'image', id: 7 })).toEqual(NO_BACKGROUND)
    expect(parseBackground({ mode: 'blur', level: 9 })).toEqual({ mode: 'blur', level: 2 })
  })
})

describe('resolveBackground', () => {
  it('drops an upload that is gone', () => {
    const custom = { mode: 'image', id: CUSTOM_BACKGROUND_ID } as const
    expect(resolveBackground(custom, false)).toEqual(NO_BACKGROUND)
    expect(resolveBackground(custom, true)).toEqual(custom)
  })

  it('leaves blur and listed pictures alone', () => {
    expect(resolveBackground({ mode: 'blur', level: 1 }, false)).toEqual({ mode: 'blur', level: 1 })
    expect(resolveBackground({ mode: 'image', id: 'aurora' }, false)).toEqual({ mode: 'image', id: 'aurora' })
  })
})

describe('imageSources', () => {
  it('has nothing for blur and none', () => {
    expect(imageSources(NO_BACKGROUND, null)).toEqual([])
    expect(imageSources({ mode: 'blur', level: 2 }, 'blob:x')).toEqual([])
  })

  it('points a built-in picture at its WebP file', () => {
    const sources = imageSources({ mode: 'image', id: 'kantor' }, null)
    expect(sources).toHaveLength(1)
    expect(sources[0]).toMatch(/backgrounds\/kantor\.webp$/)
  })

  it('uses the object URL for the upload and nothing without one', () => {
    const custom = { mode: 'image', id: CUSTOM_BACKGROUND_ID } as const
    expect(imageSources(custom, 'blob:abc')).toEqual(['blob:abc'])
    expect(imageSources(custom, null)).toEqual([])
  })
})

describe('blurRadius', () => {
  it('grows with the level and with the frame', () => {
    expect(blurRadius(1, 720)).toBeLessThan(blurRadius(2, 720))
    expect(blurRadius(2, 720)).toBeLessThan(blurRadius(3, 720))
    expect(blurRadius(2, 1080)).toBeGreaterThan(blurRadius(2, 720))
  })
})

describe('keys and words', () => {
  it('gives equal choices the same key and compares by meaning', () => {
    expect(backgroundKey({ mode: 'blur', level: 2 })).toBe(backgroundKey({ mode: 'blur', level: 2 }))
    expect(sameBackground({ mode: 'blur', level: 1 }, { mode: 'blur', level: 2 })).toBe(false)
    expect(sameBackground({ mode: 'image', id: 'kafe' }, { mode: 'image', id: 'kafe' })).toBe(true)
    expect(sameBackground(NO_BACKGROUND, { mode: 'blur', level: 1 })).toBe(false)
  })

  it('names the choice in Indonesian', () => {
    expect(describeBackground(NO_BACKGROUND)).toBe('Tanpa efek')
    expect(describeBackground({ mode: 'blur', level: 3 })).toBe('Blur kuat')
    expect(describeBackground({ mode: 'image', id: 'kafe' })).toBe('Kafe')
    expect(describeBackground({ mode: 'image', id: CUSTOM_BACKGROUND_ID })).toBe('Gambar saya')
  })

  it('ships five built-in pictures with unique ids', () => {
    expect(BACKGROUND_IMAGES).toHaveLength(5)
    expect(new Set(BACKGROUND_IMAGES.map((i) => i.id)).size).toBe(5)
  })
})
