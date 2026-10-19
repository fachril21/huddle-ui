/** Why a recording stopped. `room-empty` is the rule "the last person left, so recording ends by itself". */
export type StopReason = 'meeting-ended' | 'host-stopped' | 'room-empty'

export type RecordingStatus = 'recording' | 'processing' | 'ready'

export interface Recording {
  readonly id: string
  readonly title: string
  readonly code: string
  readonly hostName: string
  /** People who were in the room while it recorded, host first */
  readonly participants: readonly string[]
  readonly startedAt: string
  /** When recording stopped, ISO. null while it is still recording. The 24 hour clock starts here. */
  readonly stoppedAt: string | null
  readonly stopReason: StopReason | null
  /** Recorded length, seconds. Grows while recording. */
  readonly durationSec: number
  readonly sizeMb: number
  /** After stopping, the file needs a short while to be prepared */
  readonly status: RecordingStatus
}

/** A recording seen at one moment: where it is in its life. */
export type RecordingPhase = 'live' | 'processing' | 'ready' | 'expired' | 'gone'

/** How close a ready recording is to being deleted */
export type Urgency = 'calm' | 'soon' | 'urgent'
