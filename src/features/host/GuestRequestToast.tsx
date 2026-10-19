import { DoorOpen } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { Guest } from '../../state/types'
import styles from './GuestRequestToast.module.css'

interface GuestRequestToastProps {
  guests: readonly Guest[]
  /** False for people who cannot answer the door, or while the panel that lists the guests is already open */
  visible: boolean
  onAdmit: (guestId: string) => void
  onAdmitAll: () => void
  onOpen: () => void
}

/** Stays until someone answers: one guest gets a direct "Izinkan", several are counted and let in together. */
export function GuestRequestToast({ guests, visible, onAdmit, onAdmitAll, onOpen }: GuestRequestToastProps) {
  const [first] = guests
  const show = visible && first !== undefined
  const many = guests.length > 1

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="guest-request"
          className={`glass-2 ${styles.toast}`}
          role="status"
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, transition: { duration: 0.18 } }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        >
          <DoorOpen size={18} strokeWidth={1.75} aria-hidden="true" className={styles.icon} />
          <span className={styles.text}>{many ? <><b>{guests.length} orang</b> menunggu untuk bergabung</> : <><b>{first.name}</b> ingin bergabung</>}</span>
          <button type="button" className={styles.quiet} onClick={onOpen}>
            Lihat
          </button>
          <button type="button" className={styles.action} onClick={many ? onAdmitAll : () => onAdmit(first.id)}>
            {many ? 'Izinkan semua' : 'Izinkan'}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
