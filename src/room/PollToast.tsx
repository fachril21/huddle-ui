import { ChartColumn } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import styles from './PollToast.module.css'

interface PollToastProps {
  /** Question of the new poll, or null when there is nothing to announce */
  question: string | null
  onVote: () => void
}

/** "Polling baru" toast with an action, so it stays until the user votes, opens the panel, or the poll closes. */
export function PollToast({ question, onVote }: PollToastProps) {
  return (
    <div className={styles.slot}>
      <AnimatePresence>
        {question && (
          <motion.div
            className={`glass-2 ${styles.toast}`}
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <ChartColumn size={18} strokeWidth={1.75} aria-hidden="true" className={styles.icon} />
            <span className={styles.text}>
              Polling baru: <b>{question}</b>
            </span>
            <button type="button" className={styles.action} onClick={onVote}>
              Vote
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
