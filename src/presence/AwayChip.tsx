import { Coffee, Moon } from 'lucide-react'
import type { Participant } from '../state/types'
import { usePresenceNow } from './PresenceClock'
import { awayClock, awaySentence, statusWord } from './presence'
import styles from './presence.module.css'

/** "BRB 3 mnt lagi" / "AFK 6 mnt": the status word with its icon, and how long it has been or will be. */
export function AwayChip({ participant, showClock = true }: { participant: Participant; showClock?: boolean }) {
  const now = usePresenceNow()
  if (participant.status === 'none') return null
  const clock = showClock ? awayClock(participant, now) : ''
  const Icon = participant.status === 'afk' ? Moon : Coffee
  return (
    <span className={styles.chip} data-status={participant.status} data-overdue={clock.startsWith('lewat')} title={awaySentence(participant, now)}>
      <Icon size={12} strokeWidth={2} aria-hidden="true" />
      {statusWord(participant)}
      {clock && <span className={`${styles.clock} awayClock`}>{clock}</span>}
    </span>
  )
}
