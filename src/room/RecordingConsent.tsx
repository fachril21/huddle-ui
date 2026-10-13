import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import styles from './RecordingConsent.module.css'

interface RecordingConsentProps {
  onAgree: () => void
  onLeave: () => void
}

/** Modal glass-3 asking participants to agree to being recorded (PRD 5, F17). Traps focus on its two buttons. */
export function RecordingConsent({ onAgree, onLeave }: RecordingConsentProps) {
  const agreeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    agreeRef.current?.focus()
  }, [])

  return (
    <div className={styles.scrim}>
      <motion.section
        className={`glass-3 ${styles.dialog}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="rec-title"
        aria-describedby="rec-body"
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <h2 id="rec-title">Meeting ini direkam</h2>
        <p id="rec-body">Host mulai merekam meeting. Dengan tetap berada di sini, Anda setuju suara dan video Anda ikut terekam.</p>
        <div className={styles.actions}>
          <button type="button" onClick={onLeave}>
            Keluar
          </button>
          <button ref={agreeRef} type="button" className={styles.agree} onClick={onAgree}>
            Setuju
          </button>
        </div>
      </motion.section>
    </div>
  )
}
