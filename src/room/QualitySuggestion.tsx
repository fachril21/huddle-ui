import { SignalLow, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { qualityOption } from './cameraQuality'
import type { CameraQuality } from './cameraQuality'
import styles from './QualitySuggestion.module.css'

interface QualitySuggestionProps {
  weakConnection: boolean
  camOn: boolean
  quality: CameraQuality
  onLower: () => void
}

/** One-tap offer to drop the camera to Rendah while the user's connection is weak. Never changes quality by itself. */
export function QualitySuggestion({ weakConnection, camOn, quality, onLower }: QualitySuggestionProps) {
  const [dismissed, setDismissed] = useState(false)

  // A new connection problem deserves a fresh offer
  useEffect(() => {
    if (!weakConnection) setDismissed(false)
  }, [weakConnection])

  const visible = weakConnection && camOn && quality !== 'low' && !dismissed

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`glass-2 ${styles.chip}`}
          role="status"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6, transition: { duration: 0.16 } }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        >
          <SignalLow size={18} strokeWidth={1.75} aria-hidden="true" className={styles.icon} />
          <span className={styles.text}>Koneksi Anda lemah. Turunkan kamera ke {qualityOption('low').resolution}?</span>
          <button type="button" className={styles.action} onClick={onLower}>
            Turunkan
          </button>
          <button type="button" className={styles.close} aria-label="Abaikan saran" onClick={() => setDismissed(true)}>
            <X size={14} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
