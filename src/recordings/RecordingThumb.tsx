import { Play } from 'lucide-react'
import { paletteFor } from '../dashboard/people'
import { formatDuration } from './retention'
import type { Recording, RecordingPhase } from './types'
import styles from './RecordingThumb.module.css'

interface RecordingThumbProps {
  recording: Recording
  phase: RecordingPhase
  /** Big form for the detail view */
  large?: boolean
}

/** A still frame stand-in: the meeting's palette, a play mark, and the length. Live and expired ones say so instead. */
export function RecordingThumb({ recording, phase, large }: RecordingThumbProps) {
  const live = phase === 'live'
  const expired = phase === 'expired'
  return (
    <span className={styles.thumb} data-palette={paletteFor(recording.title)} data-phase={phase} data-large={large || undefined} aria-hidden="true">
      {!live && !expired && <Play size={large ? 22 : 16} strokeWidth={2} fill="currentColor" />}
      {live && <i className={styles.dot} />}
      {!expired && <span className={styles.len}>{live ? 'REC' : formatDuration(recording.durationSec)}</span>}
    </span>
  )
}
