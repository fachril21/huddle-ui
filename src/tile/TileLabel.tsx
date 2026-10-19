import type { CameraQuality } from '../room/cameraQuality'
import { qualityOption } from '../room/cameraQuality'
import type { Participant } from '../state/types'
import { AwayChip } from '../presence/AwayChip'
import { PoorSignalIcon } from './TileOverlays'
import styles from './TileLabel.module.css'

/** Glass-1 name chip. The equalizer shows only while the tile is lit (colour is never the only speaking cue). */
export function TileLabel({ participant, quality, compact = false }: { participant: Participant; quality?: CameraQuality; compact?: boolean }) {
  const showRole = participant.role === 'Host' || participant.role === 'Co-host'
  return (
    <div className={`glass-1 ${styles.label}`} data-compact={compact || undefined}>
      <span className={styles.eq} aria-hidden="true">
        <i /><i /><i />
      </span>
      {participant.connection === 'poor' && <PoorSignalIcon />}
      <span className={styles.name}>{participant.name}</span>
      {showRole && <span className={styles.role}>{participant.role}</span>}
      {quality && participant.camOn && <span className={styles.quality}>{qualityOption(quality).resolution}</span>}
      <AwayChip participant={participant} />

    </div>
  )
}
