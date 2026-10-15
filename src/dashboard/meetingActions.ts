import type { Occurrence } from './types'

/** Everything a row or the next-meeting card can ask the dashboard to do with a session. */
export interface MeetingActions {
  readonly enter: (o: Occurrence) => void
  readonly copyInvitation: (o: Occurrence) => void
  readonly copyLink: (o: Occurrence) => void
  readonly edit: (o: Occurrence) => void
  readonly duplicate: (o: Occurrence) => void
  readonly cancel: (o: Occurrence) => void
}
