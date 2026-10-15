/** Permission and device state for one media kind (camera or mic) in the lobby. */
export type MediaStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'no-device' | 'in-use' | 'error'

export type CheckState = 'ready' | 'attention' | 'untested'

/** Map a getUserMedia failure to a status. Unknown errors become 'error' so the UI never claims a cause it cannot prove. */
export function statusFromError(error: unknown): MediaStatus {
  const name = error instanceof DOMException || (typeof error === 'object' && error !== null && 'name' in error) ? String((error as { name: unknown }).name) : ''
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
    case 'PermissionDeniedError':
      return 'denied'
    case 'NotFoundError':
    case 'OverconstrainedError':
    case 'DevicesNotFoundError':
      return 'no-device'
    case 'NotReadableError':
    case 'AbortError':
    case 'TrackStartError':
      return 'in-use'
    default:
      return 'error'
  }
}

export function isUsable(status: MediaStatus): boolean {
  return status === 'granted'
}

/** Whether the user can do something about it from inside the lobby (retry) versus needing browser settings. */
export function canRetry(status: MediaStatus): boolean {
  return status === 'in-use' || status === 'error' || status === 'no-device'
}

export interface CheckInput {
  readonly status: MediaStatus
  /** Mic only: true once the input level has crossed the speaking threshold at least once */
  readonly heardSignal?: boolean
  /** Speaker only: the user confirmed hearing the test tone */
  readonly confirmed?: boolean
}

/** Camera: ready as soon as frames flow. Anything but granted needs attention, except while still asking. */
export function cameraCheck({ status }: CheckInput): CheckState {
  if (status === 'granted') return 'ready'
  return status === 'idle' || status === 'requesting' ? 'untested' : 'attention'
}

/** Mic: permission alone is not proof; ready needs a real signal from the user's voice. */
export function micCheck({ status, heardSignal = false }: CheckInput): CheckState {
  if (status === 'granted') return heardSignal ? 'ready' : 'untested'
  return status === 'idle' || status === 'requesting' ? 'untested' : 'attention'
}

/** Speaker: output can't be sensed, so only the user's confirmation counts. */
export function speakerCheck({ confirmed = false }: Pick<CheckInput, 'confirmed'>): CheckState {
  return confirmed ? 'ready' : 'untested'
}

export const STATUS_COPY: Record<Exclude<MediaStatus, 'idle' | 'requesting' | 'granted'>, { title: string; hint: string }> = {
  denied: { title: 'Izin ditolak', hint: 'Klik ikon gembok di address bar, izinkan, lalu muat ulang halaman.' },
  'no-device': { title: 'Perangkat tidak ditemukan', hint: 'Colok perangkat atau pilih yang lain, lalu coba lagi.' },
  'in-use': { title: 'Perangkat sedang dipakai', hint: 'Tutup aplikasi lain yang memakai perangkat ini, lalu coba lagi.' },
  error: { title: 'Perangkat tidak bisa dibuka', hint: 'Coba lagi, atau pilih perangkat lain.' },
}

/** One summary line for the checklist header. */
export function summarize(states: readonly CheckState[]): { label: string; allReady: boolean } {
  if (states.every((s) => s === 'ready')) return { label: 'Semua siap', allReady: true }
  const attention = states.filter((s) => s === 'attention').length
  if (attention > 0) return { label: `${attention} perlu dicek`, allReady: false }
  return { label: 'Belum dites', allReady: false }
}
