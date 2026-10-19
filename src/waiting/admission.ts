/** Where a guest stands while the host decides. Only the first two are still open. */
export type AdmissionStatus = 'waiting' | 'host-absent' | 'admitted' | 'denied' | 'timeout' | 'locked'

export interface Admission {
  readonly status: AdmissionStatus
  /** When the request was sent, ms since epoch; the waiting timer counts from here */
  readonly since: number
}

export type AdmissionAction =
  | { type: 'request'; now: number; hostPresent: boolean }
  | { type: 'resolve'; status: AdmissionStatus }
  | { type: 'tick'; now: number }
  | { type: 'cancel' }

/** Nobody answered for this long: stop pretending someone will */
export const ADMISSION_TIMEOUT_MS = 10 * 60_000
/** How long "Anda diizinkan masuk" stays on screen before the room opens */
export const ADMITTED_HOLD_MS = 1100

export const isPending = (status: AdmissionStatus): boolean => status === 'waiting' || status === 'host-absent'

/** Admission is null until a request is sent. A decision never undoes an admission. */
export function admissionReducer(state: Admission | null, action: AdmissionAction): Admission | null {
  switch (action.type) {
    case 'request':
      return { status: action.hostPresent ? 'waiting' : 'host-absent', since: action.now }
    case 'resolve':
      return state && state.status !== 'admitted' ? { ...state, status: action.status } : state
    case 'tick':
      return state && isPending(state.status) && action.now - state.since >= ADMISSION_TIMEOUT_MS ? { ...state, status: 'timeout' } : state
    case 'cancel':
      return null
  }
}

/** "0:42", "12:05": how long the guest has been waiting */
export function waitedLabel(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
