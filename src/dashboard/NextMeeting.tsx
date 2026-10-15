import { CalendarPlus, Copy, Repeat } from 'lucide-react'
import { useFx } from '../room/MotionContext'
import { entryAction } from './entryAction'
import type { MeetingActions } from './meetingActions'
import { PeopleStack } from './PeopleStack'
import { countdownLabel, formatTimeRange, occurrenceState, recurrenceLabel } from './schedule'
import { StatusTag } from './StatusTag'
import type { Occurrence } from './types'
import ui from './ui.module.css'
import styles from './NextMeeting.module.css'

interface NextMeetingProps {
  occurrence: Occurrence | null
  now: Date
  actions: MeetingActions
  onSchedule: () => void
}

/** The one session that matters next. Gets an aurora edge once it can be entered. */
export function NextMeeting({ occurrence, now, actions, onSchedule }: NextMeetingProps) {
  const { reduced } = useFx()

  if (!occurrence) {
    return (
      <section className={`glass-2 ${styles.empty}`} aria-label="Rapat berikutnya">
        <div>
          <h2>Belum ada rapat dalam waktu dekat</h2>
          <p>Jadwalkan rapat, atau mulai yang dadakan dari tombol Buat rapat.</p>
        </div>
        <button type="button" className={`${ui.btn} ${ui.primary}`} onClick={onSchedule}>
          <CalendarPlus size={16} strokeWidth={1.75} aria-hidden="true" />
          Jadwalkan rapat
        </button>
      </section>
    )
  }

  const { meeting } = occurrence
  const state = occurrenceState(occurrence, now)
  const action = entryAction(meeting.isHost, state)
  const hot = state === 'joinable' || state === 'live'
  const countdown = countdownLabel(occurrence, now)
  const statusLabel = state === 'joinable' ? `Bisa masuk, ${countdown.toLowerCase()}` : countdown

  return (
    <section className={styles.strip} data-hot={hot || undefined} data-still={reduced || undefined} aria-label="Rapat berikutnya">
      <div className={`glass-2 ${styles.inner}`}>
        <div className={styles.main}>
          <h2>{meeting.title}</h2>
          <p className={styles.meta}>
            <StatusTag state={state} label={statusLabel} />
            <span className={ui.mono}>{formatTimeRange(occurrence)}</span>
            <span className={styles.secondary}>{meeting.isHost ? 'Anda host' : `Host ${meeting.hostName}`}</span>
            <span className={`${ui.mono} ${styles.secondary}`}>{meeting.code}</span>
            {meeting.recurrence !== 'none' && (
              <span className={styles.repeat}>
                <Repeat size={13} strokeWidth={1.75} aria-hidden="true" />
                {recurrenceLabel(meeting.recurrence)}
              </span>
            )}
          </p>
        </div>

        <PeopleStack hostName={meeting.hostName} invitees={meeting.invitees} />

        <div className={styles.actions}>
          <button type="button" className={`${ui.btn} ${ui.icon}`} onClick={() => actions.copyLink(occurrence)} aria-label={`Salin tautan ${meeting.title}`} title="Salin tautan">
            <Copy size={18} strokeWidth={1.75} aria-hidden="true" />
            <span className={styles.copyLabel}>Salin tautan</span>
          </button>
          {action && (
            <button
              type="button"
              className={`${ui.btn} ${ui.large} ${action.variant === 'primary' ? ui.primary : ''}`}
              aria-disabled={!action.enabled || undefined}
              onClick={() => action.enabled && actions.enter(occurrence)}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
