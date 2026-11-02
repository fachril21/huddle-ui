import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_NAME_LENGTH, isValidName, loadName, loadRemember, normalizeName, persistName } from './displayName'
import { SPEAKING_THRESHOLD, levelFromRms, litBars, rmsFromBytes, smoothLevel } from './micLevel'
import { cameraCheck, canRetry, deviceLine, deviceProblems, micCheck, speakerCheck, statusFromError, summarize } from './mediaState'
import { matchPrejoinShortcut } from './prejoinShortcuts'

const key = (code: string, extra: Partial<KeyboardEvent> = {}, target: EventTarget | null = null) => ({
  code,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  repeat: false,
  target,
  ...extra,
})

describe('statusFromError', () => {
  it.each([
    ['NotAllowedError', 'denied'],
    ['SecurityError', 'denied'],
    ['NotFoundError', 'no-device'],
    ['OverconstrainedError', 'no-device'],
    ['NotReadableError', 'in-use'],
    ['AbortError', 'in-use'],
    ['TypeError', 'error'],
  ])('maps %s to %s', (name, expected) => {
    expect(statusFromError({ name })).toBe(expected)
  })

  it('treats a non-error value as a generic error', () => {
    expect(statusFromError(null)).toBe('error')
    expect(statusFromError('boom')).toBe('error')
  })
})

describe('device checks', () => {
  it('camera is ready only when granted', () => {
    expect(cameraCheck({ status: 'granted' })).toBe('ready')
    expect(cameraCheck({ status: 'requesting' })).toBe('untested')
    expect(cameraCheck({ status: 'denied' })).toBe('attention')
  })

  it('mic needs a real signal, not just permission', () => {
    expect(micCheck({ status: 'granted' })).toBe('untested')
    expect(micCheck({ status: 'granted', heardSignal: true })).toBe('ready')
    expect(micCheck({ status: 'in-use' })).toBe('attention')
  })

  it('speaker counts only after the user confirms', () => {
    expect(speakerCheck({})).toBe('untested')
    expect(speakerCheck({ confirmed: true })).toBe('ready')
  })

  it('summarizes the three checks', () => {
    expect(summarize(['ready', 'ready', 'ready'])).toEqual({ label: 'Semua siap', allReady: true })
    expect(summarize(['ready', 'attention', 'untested']).label).toBe('1 perlu dicek')
    expect(summarize(['untested', 'untested', 'ready']).label).toBe('Belum dites')
  })

  it('offers retry for recoverable failures only', () => {
    expect(canRetry('in-use')).toBe(true)
    expect(canRetry('denied')).toBe(false)
  })
})

describe('lobby device status', () => {
  const ok = { camOn: true, cameraStatus: 'granted', micOn: true, micStatus: 'granted' } as const

  it('has no problems when both devices work', () => {
    expect(deviceProblems(ok)).toEqual([])
  })

  it('names each device that needs attention', () => {
    const found = deviceProblems({ ...ok, cameraStatus: 'denied', micStatus: 'in-use' })
    expect(found).toEqual([
      { kind: 'camera', title: 'Izin ditolak' },
      { kind: 'mic', title: 'Perangkat sedang dipakai' },
    ])
  })

  it('does not call a device still asking for permission a problem', () => {
    expect(deviceProblems({ ...ok, cameraStatus: 'requesting', micStatus: 'idle' })).toEqual([])
  })

  it('says what the person arrives with', () => {
    expect(deviceLine(ok)).toBe('Kamera dan mikrofon siap')
    expect(deviceLine({ ...ok, micOn: false })).toBe('Kamera siap · Mikrofon mati')
    expect(deviceLine({ ...ok, camOn: false, micStatus: 'requesting' })).toBe('Kamera mati · Mikrofon disiapkan')
  })
})

describe('mic level', () => {
  it('reads silence as zero', () => {
    expect(rmsFromBytes(new Uint8Array(64).fill(128))).toBe(0)
    expect(rmsFromBytes([])).toBe(0)
  })

  it('reads a full-scale square wave as 1', () => {
    expect(rmsFromBytes(new Uint8Array([0, 255, 0, 255]))).toBeCloseTo(1, 1)
  })

  it('clamps the meter to 0..1', () => {
    expect(levelFromRms(-1)).toBe(0)
    expect(levelFromRms(5)).toBe(1)
  })

  it('rises faster than it falls', () => {
    const up = smoothLevel(0, 1)
    const down = 1 - smoothLevel(1, 0)
    expect(up).toBeGreaterThan(down)
  })

  it('lights at least one bar for any audible signal and none for silence', () => {
    expect(litBars(0, 12)).toBe(0)
    expect(litBars(0.02, 12)).toBe(1)
    expect(litBars(1, 12)).toBe(12)
    expect(SPEAKING_THRESHOLD).toBeGreaterThan(0)
  })
})

describe('display name', () => {
  it('collapses whitespace and trims', () => {
    expect(normalizeName('  Budi   Santoso  ')).toBe('Budi Santoso')
  })

  it('rejects empty and whitespace-only names', () => {
    expect(isValidName('')).toBe(false)
    expect(isValidName('    ')).toBe(false)
    expect(isValidName(' A ')).toBe(true)
  })

  it('caps the length', () => {
    expect(normalizeName('x'.repeat(100)).length).toBe(MAX_NAME_LENGTH)
  })
})

describe('remembering the name', () => {
  const store = new Map<string, string>()
  beforeAll(() =>
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    }),
  )
  afterAll(() => vi.unstubAllGlobals())
  beforeEach(() => store.clear())

  it('remembers by default', () => {
    expect(loadRemember()).toBe(true)
  })

  it('keeps the name when asked to', () => {
    persistName('Budi', true)
    expect(loadName()).toBe('Budi')
    expect(loadRemember()).toBe(true)
  })

  it('wipes the name and keeps the choice when asked not to', () => {
    persistName('Budi', true)
    persistName('Budi', false)
    expect(loadName()).toBe('')
    expect(loadRemember()).toBe(false)
  })

  it('turns remembering back on', () => {
    persistName('Budi', false)
    persistName('Ani', true)
    expect(loadName()).toBe('Ani')
    expect(loadRemember()).toBe(true)
  })
})

class FakeElement extends EventTarget {
  readonly isContentEditable = false
  constructor(readonly tagName: string) {
    super()
  }
}

describe('prejoin shortcuts', () => {
  beforeAll(() => vi.stubGlobal('HTMLElement', FakeElement))
  afterAll(() => vi.unstubAllGlobals())

  it('maps M and V like the room', () => {
    expect(matchPrejoinShortcut(key('KeyM'))).toBe('mic')
    expect(matchPrejoinShortcut(key('KeyV'))).toBe('camera')
  })

  it('joins on Enter from the page body', () => {
    expect(matchPrejoinShortcut(key('Enter'))).toBe('join')
  })

  it('ignores modifiers and key repeat', () => {
    expect(matchPrejoinShortcut(key('KeyM', { ctrlKey: true }))).toBeNull()
    expect(matchPrejoinShortcut(key('KeyM', { repeat: true }))).toBeNull()
  })

  it('does not hijack typing or buttons', () => {
    const input = new FakeElement('INPUT')
    const button = new FakeElement('BUTTON')
    expect(matchPrejoinShortcut(key('KeyM', {}, input))).toBeNull()
    expect(matchPrejoinShortcut(key('Enter', {}, input))).toBeNull()
    expect(matchPrejoinShortcut(key('Enter', {}, button))).toBeNull()
  })
})
