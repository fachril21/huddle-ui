import { describe, expect, it } from 'vitest'
import { LOCK_MS, MAX_ATTEMPTS, OTP_LENGTH, OTP_TTL_MS, RESEND_MS, canResend, checkOtp, expireNow, generateOtpCode, issueOtp, resendOtp, secondsUntil } from './otpFlow'

const T0 = 1_000_000
const issue = () => issueOtp('dewi@dibimbing.id', T0, '123456')

function failUntilLocked(start = issue()) {
  let s = start
  for (let i = 0; i < MAX_ATTEMPTS; i++) s = checkOtp(s, '000000', T0).state
  return s
}

describe('generateOtpCode', () => {
  it('makes a zero-padded numeric code of the right length', () => {
    expect(generateOtpCode(() => 0)).toBe('000000')
    expect(generateOtpCode(() => 0.999999)).toBe('999999')
    expect(generateOtpCode()).toMatch(new RegExp(`^\\d{${OTP_LENGTH}}$`))
  })
})

describe('issueOtp', () => {
  it('starts a fresh challenge with its clocks set from now', () => {
    const s = issue()
    expect(s.email).toBe('dewi@dibimbing.id')
    expect(s.expiresAt).toBe(T0 + OTP_TTL_MS)
    expect(s.resendAt).toBe(T0 + RESEND_MS)
    expect(s.failures).toBe(0)
    expect(s.lockedUntil).toBe(0)
  })
})

describe('checkOtp', () => {
  it('accepts the right code', () => {
    expect(checkOtp(issue(), '123456', T0 + 5000).outcome).toEqual({ kind: 'ok' })
  })

  it('asks for the rest of the digits when the entry is short or not numeric', () => {
    expect(checkOtp(issue(), '123', T0).outcome).toEqual({ kind: 'incomplete' })
    expect(checkOtp(issue(), '12345a', T0).outcome).toEqual({ kind: 'incomplete' })
  })

  it('counts a wrong code and says how many tries are left', () => {
    const r = checkOtp(issue(), '000000', T0)
    expect(r.outcome).toEqual({ kind: 'wrong', attemptsLeft: MAX_ATTEMPTS - 1 })
    expect(r.state.failures).toBe(1)
  })

  it('does not count an unfinished entry as a try', () => {
    expect(checkOtp(issue(), '12', T0).state.failures).toBe(0)
  })

  it('locks after the last wrong try and refuses even the right code while locked', () => {
    let s = issue()
    let last = checkOtp(s, '000000', T0)
    for (let i = 1; i < MAX_ATTEMPTS; i++) {
      s = last.state
      last = checkOtp(s, '000000', T0)
    }
    expect(last.outcome).toEqual({ kind: 'locked', secondsLeft: LOCK_MS / 1000 })
    const during = checkOtp(last.state, '123456', T0 + 10_000)
    expect(during.outcome).toEqual({ kind: 'locked', secondsLeft: LOCK_MS / 1000 - 10 })
  })

  it('lets the user try again once the lock has passed', () => {
    const after = checkOtp(failUntilLocked(), '123456', T0 + LOCK_MS)
    expect(after.outcome).toEqual({ kind: 'ok' })
  })

  it('starts the count over after a lock', () => {
    const r = checkOtp(failUntilLocked(), '000000', T0 + LOCK_MS)
    expect(r.outcome).toEqual({ kind: 'wrong', attemptsLeft: MAX_ATTEMPTS - 1 })
  })

  it('reports an old code as expired, without counting a try', () => {
    const r = checkOtp(issue(), '123456', T0 + OTP_TTL_MS)
    expect(r.outcome).toEqual({ kind: 'expired' })
    expect(r.state.failures).toBe(0)
  })

  it('does not mutate the state it was given', () => {
    const s = issue()
    checkOtp(s, '000000', T0)
    expect(s.failures).toBe(0)
  })
})

describe('resend', () => {
  it('is blocked during the cooldown and open after it', () => {
    const s = issue()
    expect(canResend(s, T0 + RESEND_MS - 1)).toBe(false)
    expect(canResend(s, T0 + RESEND_MS)).toBe(true)
  })

  it('is blocked while locked, even after the cooldown', () => {
    expect(canResend(failUntilLocked(), T0 + RESEND_MS)).toBe(false)
  })

  it('issues a new code and resets the clocks, but keeps the failure count', () => {
    const s = checkOtp(issue(), '000000', T0).state
    const next = resendOtp(s, T0 + RESEND_MS, '654321')
    expect(next.code).toBe('654321')
    expect(next.expiresAt).toBe(T0 + RESEND_MS + OTP_TTL_MS)
    expect(next.resendAt).toBe(T0 + 2 * RESEND_MS)
    expect(next.failures).toBe(1)
  })

  it('refuses to resend before the cooldown ends', () => {
    const s = issue()
    expect(resendOtp(s, T0 + 1000, '654321')).toBe(s)
  })

  it('stops the old code from working', () => {
    const next = resendOtp(issue(), T0 + RESEND_MS, '654321')
    expect(checkOtp(next, '123456', T0 + RESEND_MS).outcome.kind).toBe('wrong')
  })
})

describe('expireNow', () => {
  it('ends the code right away (a demo control)', () => {
    expect(checkOtp(expireNow(issue(), T0 + 1000), '123456', T0 + 1000).outcome).toEqual({ kind: 'expired' })
  })
})

describe('secondsUntil', () => {
  it('rounds up and never goes below zero', () => {
    expect(secondsUntil(T0 + 1500, T0)).toBe(2)
    expect(secondsUntil(T0, T0 + 5000)).toBe(0)
  })
})
