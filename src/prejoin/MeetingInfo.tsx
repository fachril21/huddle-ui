import { Users } from 'lucide-react'
import { ALL_PARTICIPANTS, VISIBLE_COUNT } from '../demo/participants'
import { MEETING_CODE, MEETING_TITLE } from '../room/meeting'
import { SELF_ID } from '../state/types'
import styles from './MeetingInfo.module.css'

const SHOWN_NAMES = 2

/** Names of the people already in the room, for the "who's inside" line. */
export function insideSummary(): string {
  const inside = ALL_PARTICIPANTS.slice(0, VISIBLE_COUNT).filter((p) => p.id !== SELF_ID)
  const names = inside.slice(0, SHOWN_NAMES).map((p) => p.name)
  const rest = inside.length - names.length
  return rest > 0 ? `${names.join(', ')} dan ${rest} lainnya sudah di dalam` : `${names.join(', ')} sudah di dalam`
}

/** Meeting title, code and who is already in. The lobby's answer to "am I in the right place?". */
export function MeetingInfo() {
  return (
    <header className={styles.info}>
      <h1>Siap bergabung?</h1>
      <p className={styles.title}>
        {MEETING_TITLE} <span className={styles.code}>{MEETING_CODE}</span>
      </p>
      <p className={styles.inside}>
        <Users size={14} strokeWidth={1.75} aria-hidden="true" />
        {insideSummary()}
      </p>
    </header>
  )
}
