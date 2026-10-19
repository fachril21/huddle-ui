import { describe, expect, it } from 'vitest'
import { ADMISSION_TIMEOUT_MS, admissionReducer, isPending, waitedLabel } from './admission'
import type { Admission } from './admission'

const T0 = 1_000_000
const waiting: Admission = { status: 'waiting', since: T0 }

describe('admissionReducer', () => {
  it('opens as waiting when the host is in, and as host-absent when not', () => {
    expect(admissionReducer(null, { type: 'request', now: T0, hostPresent: true })).toEqual(waiting)
    expect(admissionReducer(null, { type: 'request', now: T0, hostPresent: false })?.status).toBe('host-absent')
  })

  it('restarts the timer when a denied guest asks again', () => {
    const denied: Admission = { status: 'denied', since: T0 }
    expect(admissionReducer(denied, { type: 'request', now: T0 + 5000, hostPresent: true })).toEqual({ status: 'waiting', since: T0 + 5000 })
  })

  it('keeps the original request time when a decision arrives', () => {
    expect(admissionReducer(waiting, { type: 'resolve', status: 'denied' })).toEqual({ status: 'denied', since: T0 })
  })

  it('never undoes an admission', () => {
    const admitted: Admission = { status: 'admitted', since: T0 }
    expect(admissionReducer(admitted, { type: 'resolve', status: 'denied' })).toBe(admitted)
    expect(admissionReducer(admitted, { type: 'tick', now: T0 + ADMISSION_TIMEOUT_MS * 2 })).toBe(admitted)
  })

  it('times out only while still pending and only after the limit', () => {
    expect(admissionReducer(waiting, { type: 'tick', now: T0 + ADMISSION_TIMEOUT_MS - 1 })).toBe(waiting)
    expect(admissionReducer(waiting, { type: 'tick', now: T0 + ADMISSION_TIMEOUT_MS })?.status).toBe('timeout')
    const denied: Admission = { status: 'denied', since: T0 }
    expect(admissionReducer(denied, { type: 'tick', now: T0 + ADMISSION_TIMEOUT_MS * 2 })).toBe(denied)
  })

  it('ignores a decision when no request was sent, and clears on cancel', () => {
    expect(admissionReducer(null, { type: 'resolve', status: 'admitted' })).toBeNull()
    expect(admissionReducer(waiting, { type: 'cancel' })).toBeNull()
  })
})

describe('isPending', () => {
  it('is true only while a decision can still come', () => {
    expect(isPending('waiting')).toBe(true)
    expect(isPending('host-absent')).toBe(true)
    for (const s of ['admitted', 'denied', 'timeout', 'locked'] as const) expect(isPending(s)).toBe(false)
  })
})

describe('waitedLabel', () => {
  it('counts minutes and zero-padded seconds', () => {
    expect(waitedLabel(0)).toBe('0:00')
    expect(waitedLabel(42_900)).toBe('0:42')
    expect(waitedLabel(725_000)).toBe('12:05')
    expect(waitedLabel(-500)).toBe('0:00')
  })
})
