import { motion } from 'motion/react'
import type { Phase } from '../state/types'
import { Ambient } from './Ambient'
import styles from './ClosingScreen.module.css'

interface ClosingScreenProps {
  phase: Exclude<Phase, 'live'>
  onRestart: () => void
}

const COPY: Record<ClosingScreenProps['phase'], { title: string; body: string }> = {
  left: { title: 'Anda sudah keluar', body: 'Terima kasih sudah bergabung di Brainstorm sprint.' },
  ended: { title: 'Meeting telah diakhiri', body: 'Host mengakhiri meeting untuk semua peserta.' },
}

/** Simple closing screen after leaving or ending (PRD 8.8) with a way back into the demo. */
export function ClosingScreen({ phase, onRestart }: ClosingScreenProps) {
  const { title, body } = COPY[phase]
  return (
    <div className={styles.screen}>
      <Ambient />
      <motion.section
        className={`glass-3 ${styles.card}`}
        role="alertdialog"
        aria-labelledby="closing-title"
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <h1 id="closing-title">{title}</h1>
        <p>{body}</p>
        <button type="button" autoFocus onClick={onRestart}>
          Mulai ulang demo
        </button>
      </motion.section>
    </div>
  )
}
