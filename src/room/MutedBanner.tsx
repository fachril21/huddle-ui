import { MicOff } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import styles from './MutedBanner.module.css'

interface MutedBannerProps {
  visible: boolean
  onUnmute: () => void
}

/** Shown only to the local user when voice is detected with the mic off (PRD 6.5). */
export function MutedBanner({ visible, onUnmute }: MutedBannerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`glass-2 ${styles.banner}`}
          role="status"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          <MicOff size={18} strokeWidth={1.75} aria-hidden="true" className={styles.icon} />
          <span>Mikrofon Anda mati, tetapi suara Anda terdengar</span>
          <button type="button" className={styles.action} onClick={onUnmute}>
            Nyalakan mic
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
