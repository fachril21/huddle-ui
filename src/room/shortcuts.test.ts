import { describe, expect, it } from 'vitest'
import { matchShortcut, SHORTCUTS, shortcutKey } from './shortcuts'

const press = (code: string, mods: Partial<Record<'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey' | 'repeat', boolean>> = {}) =>
  matchShortcut({ code, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, repeat: false, ...mods })

describe('matchShortcut', () => {
  it('matches a plain key press', () => {
    expect(press('KeyM')).toBe('mic')
    expect(press('Digit5')).toBe('highFive')
  })

  it('ignores presses with ctrl, meta or alt so browser and tile-reorder shortcuts keep working', () => {
    expect(press('KeyM', { ctrlKey: true })).toBeNull()
    expect(press('KeyM', { metaKey: true })).toBeNull()
    expect(press('KeyM', { altKey: true })).toBeNull()
  })

  it('leaves Shift+D to the Demo Director and ignores shifted letters', () => {
    expect(press('KeyD', { shiftKey: true })).toBeNull()
    expect(press('KeyM', { shiftKey: true })).toBeNull()
  })

  it('ignores auto-repeat so holding a key does not toggle again', () => {
    expect(press('KeyM', { repeat: true })).toBeNull()
  })

  it('opens help only with Shift+Slash', () => {
    expect(press('Slash', { shiftKey: true })).toBe('help')
    expect(press('Slash')).toBeNull()
  })

  it('returns null for keys without a shortcut', () => {
    expect(press('KeyZ')).toBeNull()
  })
})

describe('registry', () => {
  it('has unique key codes and ids', () => {
    expect(new Set(SHORTCUTS.map((s) => s.code)).size).toBe(SHORTCUTS.length)
    expect(new Set(SHORTCUTS.map((s) => s.id)).size).toBe(SHORTCUTS.length)
  })

  it('exposes the key cap text by id', () => {
    expect(shortcutKey('mic')).toBe('M')
    expect(shortcutKey('help')).toBe('?')
  })
})
