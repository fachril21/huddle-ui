export const OTP_LENGTH = 6
export const OTP_TTL_MS = 5 * 60_000
export const RESEND_MS = 30_000
export const MAX_ATTEMPTS = 5
export const LOCK_MS = 60_000

/**
 * One email-code challenge. The prototype keeps the code here so the demo inbox can show it;
 * in production the server holds it and the browser never sees it.
 */
export interface OtpState {
  readonly email: string
  readonly code: string
  readonly expiresAt: number
  readonly resendAt: number
  readonly failures: number
  /** 0 = not locked */
  readonly lockedUntil: number
}

export type OtpOutcome =
  | { readonly kind: 'ok' }
  | { readonly kind: 'incomplete' }
  | { readonly kind: 'wrong'; readonly attemptsLeft: number }
  | { readonly kind: 'expired' }
  | { readonly kind: 'locked'; readonly secondsLeft: number }

const ENTRY_RE = new RegExp(`^\\d{${OTP_LENGTH}}$`)

function randomUnit(): number {
  const [value] = crypto.getRandomValues(new Uint32Array(1))
  return value / 2 ** 32
}

export function generateOtpCode(random: () => number = randomUnit): string {
  return String(Math.floor(random() * 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0')
}

export function secondsUntil(at: number, now: number): number {
  return Math.max(0, Math.ceil((at - now) / 1000))
}

export function issueOtp(email: string, now: number, code: string): OtpState {
  return { email, code, expiresAt: now + OTP_TTL_MS, resendAt: now + RESEND_MS, failures: 0, lockedUntil: 0 }
}

export function isLocked(state: OtpState, now: number): boolean {
  return state.lockedUntil > now
}

/** Resend waits out its cooldown, and never works as a way around a lock. */
export function canResend(state: OtpState, now: number): boolean {
  return now >= state.resendAt && !isLocked(state, now)
}

/** A new code replaces the old one. Failures carry over, so resending cannot reset the attempt budget. */
export function resendOtp(state: OtpState, now: number, code: string): OtpState {
  if (!canResend(state, now)) return state
  return { ...state, code, expiresAt: now + OTP_TTL_MS, resendAt: now + RESEND_MS }
}

/** Demo control: make the current code run out right now. */
export function expireNow(state: OtpState, now: number): OtpState {
  return { ...state, expiresAt: now }
}

export function checkOtp(state: OtpState, entry: string, now: number): { state: OtpState; outcome: OtpOutcome } {
  if (isLocked(state, now)) return { state, outcome: { kind: 'locked', secondsLeft: secondsUntil(state.lockedUntil, now) } }

  // a lock that has run out starts the count over
  const current = state.lockedUntil !== 0 ? { ...state, failures: 0, lockedUntil: 0 } : state

  if (!ENTRY_RE.test(entry)) return { state: current, outcome: { kind: 'incomplete' } }
  if (now >= current.expiresAt) return { state: current, outcome: { kind: 'expired' } }
  if (entry === current.code) return { state: current, outcome: { kind: 'ok' } }

  const failures = current.failures + 1
  if (failures >= MAX_ATTEMPTS) {
    return { state: { ...current, failures, lockedUntil: now + LOCK_MS }, outcome: { kind: 'locked', secondsLeft: secondsUntil(now + LOCK_MS, now) } }
  }
  return { state: { ...current, failures }, outcome: { kind: 'wrong', attemptsLeft: MAX_ATTEMPTS - failures } }
}
