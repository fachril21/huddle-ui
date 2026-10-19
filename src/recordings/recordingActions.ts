import type { Recording } from './types'

/** What a recording row or the detail view can ask for. The dashboard decides what each one does. */
export interface RecordingActions {
  /** Show the detail; `delete` opens it already asking to confirm */
  readonly open: (r: Recording, intent?: 'delete') => void
  readonly download: (r: Recording) => void
  readonly copyLink: (r: Recording) => void
  /** Delete the file now, or clear an expired trace */
  readonly remove: (r: Recording) => void
  /** Back into a meeting that is still being recorded */
  readonly rejoin: (r: Recording) => void
}
