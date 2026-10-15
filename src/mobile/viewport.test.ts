import { describe, expect, it } from 'vitest'
import { SHEET_CLOSE_DISTANCE, classifyViewport, keyboardInset, shouldCloseSheet } from './viewport'

describe('classifyViewport', () => {
  it.each([
    [320, 568, true, 'phone'],
    [390, 844, true, 'phone'],
    [767, 1000, false, 'phone'],
    [768, 1024, true, 'tablet'],
    [1099, 800, false, 'tablet'],
    [1100, 800, false, 'desktop'],
    [1440, 900, false, 'desktop'],
  ] as const)('%ix%i coarse=%s is %s', (w, h, coarse, expected) => {
    expect(classifyViewport(w, h, coarse).sizeClass).toBe(expected)
  })

  it('treats a phone held sideways as a short tablet-class screen', () => {
    const v = classifyViewport(844, 390, true)
    expect(v).toMatchObject({ sizeClass: 'tablet', landscape: true, shortHeight: true })
    expect(classifyViewport(932, 430, true).sizeClass).toBe('tablet')
  })

  it('does not treat a short desktop window as a phone', () => {
    const v = classifyViewport(1280, 480, false)
    expect(v.shortHeight).toBe(false)
    expect(v.sizeClass).toBe('desktop')
  })

  it('reports orientation', () => {
    expect(classifyViewport(390, 844, true).landscape).toBe(false)
    expect(classifyViewport(844, 390, true).landscape).toBe(true)
  })
})

describe('keyboardInset', () => {
  it('is the height the keyboard takes from the bottom', () => {
    expect(keyboardInset(844, 500, 0)).toBe(344)
  })

  it('ignores browser chrome sliding in and out', () => {
    expect(keyboardInset(844, 800, 0)).toBe(0)
    expect(keyboardInset(844, 844, 0)).toBe(0)
  })

  it('accounts for the visual viewport being scrolled', () => {
    expect(keyboardInset(844, 500, 100)).toBe(244)
  })
})

describe('shouldCloseSheet', () => {
  it('closes after a long drag or a quick flick, not a small nudge', () => {
    expect(shouldCloseSheet(SHEET_CLOSE_DISTANCE, 0.1)).toBe(true)
    expect(shouldCloseSheet(40, 0.9)).toBe(true)
    expect(shouldCloseSheet(40, 0.2)).toBe(false)
    expect(shouldCloseSheet(10, 2)).toBe(false)
    expect(shouldCloseSheet(-50, -1)).toBe(false)
  })
})
