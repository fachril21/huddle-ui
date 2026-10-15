import { Lock, Signal, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import type { RecordingState } from '../state/types'
import styles from './TopBar.module.css'

interface TopBarProps {
  recording: RecordingState
  locked: boolean
  /** Extra control shown first, e.g. the grid pager */
  leading?: ReactNode
  /** Layout menu, shown after the status chips */
  menu?: ReactNode
  /** Phone: a button for the participant list, since the side pill with it is gone */
  people?: { count: number; active: boolean; onClick: () => void }
}

/** Top-right chips: Merekam, Meeting terkunci, connection quality (PRD 7.2). */
export function TopBar({ recording, locked, leading, menu, people }: TopBarProps) {
  return (
    <div className={styles.bar}>
      {leading}
      {recording !== 'off' && (
        <div className={`glass-1 ${styles.chip}`} role="status">
          <i className={styles.rec} data-paused={recording === 'paused'} aria-hidden="true" />
          <span>{recording === 'paused' ? 'Rekaman dijeda' : 'Merekam'}</span>
        </div>
      )}
      {locked && (
        <div className={`glass-1 ${styles.chip}`} role="status">
          <Lock size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>Meeting terkunci</span>
        </div>
      )}
      <div className={`glass-1 ${styles.chip} ${styles.signalChip}`} role="status" aria-label="Koneksi baik">
        <Signal size={16} strokeWidth={1.75} aria-hidden="true" className={styles.signal} />
        <span className={styles.label}>Koneksi baik</span>
      </div>
      {menu}
      {people && (
        <button type="button" className={`glass-1 ${styles.chip} ${styles.people}`} aria-pressed={people.active} aria-label={`Peserta, ${people.count} orang`} onClick={people.onClick}>
          <Users size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>{people.count}</span>
        </button>
      )}
    </div>
  )
}
