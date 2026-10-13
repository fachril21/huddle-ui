import { AnimatePresence, motion } from 'motion/react'
import type { Notice } from '../state/types'
import styles from './NoticeStack.module.css'

/** Short-lived text chips for host actions ("Budi disetujui masuk", "Semua peserta dibisukan"). */
export function NoticeStack({ notices }: { notices: readonly Notice[] }) {
  return (
    <div className={styles.stack} aria-live="polite">
      <AnimatePresence initial={false}>
        {notices.map((n) => (
          <motion.div
            key={n.id}
            layout
            className={`glass-1 ${styles.notice}`}
            initial={{ opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          >
            {n.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
