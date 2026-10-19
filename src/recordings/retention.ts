import type { Recording, RecordingPhase, StopReason, Urgency } from './types'

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

/** A stopped recording is kept this long, then deleted */
export const RETENTION_MS = 24 * HOUR
/** After deletion a short trace (title, date, length) stays this long so people know it existed */
export const TRACE_MS = 7 * DAY
/** The file is being prepared this long after recording stops */
export const PROCESSING_MS = 2 * MIN

/** Below these remaining times a recording turns "soon" and "urgent" */
export const SOON_MS = 12 * HOUR
export const URGENT_MS = 3 * HOUR

/** When the file is deleted. null while the recording is still going: the clock has not started. */
export function expiresAt(r: Pick<Recording, 'stoppedAt'>): Date | null {
  return r.stoppedAt ? new Date(Date.parse(r.stoppedAt) + RETENTION_MS) : null
}

/** When the trace itself disappears */
export function traceEndsAt(r: Pick<Recording, 'stoppedAt'>): Date | null {
  return r.stoppedAt ? new Date(Date.parse(r.stoppedAt) + RETENTION_MS + TRACE_MS) : null
}

export function remainingMs(r: Pick<Recording, 'stoppedAt'>, now: Date): number | null {
  const end = expiresAt(r)
  return end ? end.getTime() - now.getTime() : null
}

export function phaseOf(r: Recording, now: Date): RecordingPhase {
  if (r.stoppedAt === null) return 'live'
  const stopped = Date.parse(r.stoppedAt)
  const age = now.getTime() - stopped
  if (age >= RETENTION_MS + TRACE_MS) return 'gone'
  if (age >= RETENTION_MS) return 'expired'
  return r.status === 'processing' && age < PROCESSING_MS ? 'processing' : 'ready'
}

export function urgencyOf(remaining: number): Urgency {
  if (remaining <= URGENT_MS) return 'urgent'
  if (remaining <= SOON_MS) return 'soon'
  return 'calm'
}

/** "18j 20m", "45 mnt", "Kurang dari 1 mnt" */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Habis'
  const totalMin = Math.floor(ms / MIN)
  if (totalMin < 1) return 'Kurang dari 1 mnt'
  if (totalMin < 60) return `${totalMin} mnt`
  const hours = Math.floor(totalMin / 60)
  return `${hours}j ${totalMin % 60}m`
}

/** "1j 05m 09d" for long recordings, "04:32" for short ones */
export function formatDuration(sec: number): string {
  const total = Math.max(0, Math.round(sec))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const two = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`
}

export function formatSize(mb: number): string {
  return mb >= 1000 ? `${(mb / 1000).toFixed(1).replace('.', ',')} GB` : `${Math.round(mb)} MB`
}

const STOP_LABEL: Record<StopReason, string> = {
  'meeting-ended': 'Rapat berakhir',
  'host-stopped': 'Dihentikan host',
  'room-empty': 'Berhenti otomatis, semua peserta keluar',
}

export function stopReasonLabel(reason: StopReason): string {
  return STOP_LABEL[reason]
}

const STOP_SHORT: Record<StopReason, string> = {
  'meeting-ended': 'Rapat berakhir',
  'host-stopped': 'Dihentikan host',
  'room-empty': 'Berhenti otomatis',
}

/** The same reason in a few words, for a row that must stay on one line */
export function stopReasonShort(reason: StopReason): string {
  return STOP_SHORT[reason]
}

export interface RecordingGroups {
  /** Still recording, newest first */
  readonly live: readonly Recording[]
  /** Processing or ready: soonest to be deleted first, so what needs downloading comes first */
  readonly active: readonly Recording[]
  /** Deleted but still remembered, most recently deleted first */
  readonly traces: readonly Recording[]
}

export function groupRecordings(recordings: readonly Recording[], now: Date): RecordingGroups {
  const live: Recording[] = []
  const active: Recording[] = []
  const traces: Recording[] = []
  for (const r of recordings) {
    const phase = phaseOf(r, now)
    if (phase === 'live') live.push(r)
    else if (phase === 'processing' || phase === 'ready') active.push(r)
    else if (phase === 'expired') traces.push(r)
  }
  const stopped = (r: Recording) => Date.parse(r.stoppedAt ?? r.startedAt)
  live.sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
  active.sort((a, b) => stopped(a) - stopped(b))
  traces.sort((a, b) => stopped(b) - stopped(a))
  return { live, active, traces }
}
