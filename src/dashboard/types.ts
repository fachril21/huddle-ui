export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly'

export interface MeetingSecurity {
  /** Shown in the invitation; the prototype never enforces it */
  readonly passcode: string | null
  /** Guests (not the host) wait in the waiting room until the host lets them in */
  readonly waitingRoom: boolean
  readonly muteOnJoin: boolean
}

export interface Meeting {
  readonly id: string
  /** abc-defg-hij, also the tail of the invite link */
  readonly code: string
  readonly title: string
  readonly description: string
  /** First session, ISO UTC. Recurring meetings repeat from here. */
  readonly startsAt: string
  readonly durationMin: number
  /** IANA zone the host picked. Display always uses DISPLAY_TZ. */
  readonly timezone: string
  readonly recurrence: Recurrence
  readonly invitees: readonly string[]
  readonly hostName: string
  readonly isHost: boolean
  readonly security: MeetingSecurity
  readonly cancelled: boolean
  /** Start times (ISO UTC) of single sessions cancelled or moved out of a series */
  readonly skipped: readonly string[]
}

/** One concrete session of a meeting. A one-off meeting has exactly one. */
export interface Occurrence {
  readonly key: string
  readonly meeting: Meeting
  readonly start: Date
  readonly end: Date
}

export type OccurrenceState = 'upcoming' | 'joinable' | 'live' | 'ended'

/** What the lobby needs to know about the room being entered. */
export interface JoinTarget {
  readonly code: string
  readonly title: string
  readonly hostName: string
  /** The "who is inside" line */
  readonly insideNote: string
  /** The viewer is a guest of a meeting with a waiting room, so Join becomes a request */
  readonly needsApproval?: boolean
  /** The host is already in the room; false means the guest also waits for the host to arrive */
  readonly hostPresent?: boolean
}
