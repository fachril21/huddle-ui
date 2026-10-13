import type { Participant } from '../state/types'
import styles from './TileLabel.module.css'

/** Glass-1 name chip. The equalizer shows only while the tile is lit (colour is never the only speaking cue). */
export function TileLabel({ participant }: { participant: Participant }) {
  const showRole = participant.role === 'Host' || participant.role === 'Co-host'
  return (
    <div className={`glass-1 ${styles.label}`}>
      <span className={styles.eq} aria-hidden="true">
        <i /><i /><i />
      </span>
      <span className={styles.name}>{participant.name}</span>
      {showRole && <span className={styles.role}>{participant.role}</span>}
    </div>
  )
}
