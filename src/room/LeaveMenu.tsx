import { DoorOpen, LogOut, PhoneOff, Radio } from 'lucide-react'
import { motion } from 'motion/react'
import styles from './LeaveMenu.module.css'

interface LeaveMenuProps {
  canEndForAll: boolean
  /** Leaving now empties the room while it is being recorded: the recording will stop by itself */
  stopsRecording?: boolean
  /** Set while the user is inside a Ruang diskusi they may walk out of */
  onReturnMain?: () => void
  onLeave: () => void
  onEnd: () => void
}

/** Popover above "Keluar" (PRD 8.8): leave alone, or (host only) end the meeting for everyone. */
export function LeaveMenu({ canEndForAll, stopsRecording, onReturnMain, onLeave, onEnd }: LeaveMenuProps) {
  return (
    <motion.div
      className={`glass-2 ${styles.menu}`}
      role="menu"
      aria-label="Keluar dari meeting"
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97, transition: { duration: 0.12 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
    >
      {stopsRecording && (
        <p className={styles.note} role="status">
          <Radio size={14} strokeWidth={1.75} aria-hidden="true" />
          Anda yang terakhir di ruangan. Rekaman akan berhenti dan tersimpan 24 jam.
        </p>
      )}
      {onReturnMain && (
        <button type="button" role="menuitem" onClick={onReturnMain}>
          <DoorOpen size={18} strokeWidth={1.75} aria-hidden="true" />
          Kembali ke ruang utama
        </button>
      )}
      <button type="button" role="menuitem" onClick={onLeave}>
        <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
        Keluar dari meeting
      </button>
      {canEndForAll && (
        <button type="button" role="menuitem" className={styles.danger} onClick={onEnd}>
          <PhoneOff size={18} strokeWidth={1.75} aria-hidden="true" />
          Akhiri untuk semua
        </button>
      )}
    </motion.div>
  )
}
