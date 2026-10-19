import { motion } from 'motion/react'
import type { Phase } from '../state/types'
import { Ambient } from './Ambient'
import styles from './ClosingScreen.module.css'

/** What happens to the recording once this person is gone, or null when nothing was being recorded. */
export function closingRecordingNote(phase: Exclude<Phase, 'live'>, recording: boolean, othersInRoom: number): string | null {
  if (!recording) return null
  if (phase === 'ended') return 'Rekaman rapat ini tersimpan 24 jam di halaman Rekaman.'
  if (othersInRoom === 0) return 'Karena Anda yang terakhir, rekaman berhenti otomatis dan tersimpan 24 jam di halaman Rekaman.'
  return 'Rekaman masih berjalan selama masih ada peserta. Hasilnya tersimpan 24 jam di halaman Rekaman.'
}

interface ClosingScreenProps {
  phase: Exclude<Phase, 'live'>
  recordingNote?: string | null
  onRestart: () => void
}

const COPY: Record<ClosingScreenProps['phase'], { title: string; body: string }> = {
  left: { title: 'Anda sudah keluar', body: 'Terima kasih sudah bergabung di Brainstorm sprint.' },
  ended: { title: 'Meeting telah diakhiri', body: 'Host mengakhiri meeting untuk semua peserta.' },
}

/** Simple closing screen after leaving or ending (PRD 8.8) with a way back into the demo. */
export function ClosingScreen({ phase, recordingNote, onRestart }: ClosingScreenProps) {
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
        {recordingNote && <p className={styles.note}>{recordingNote}</p>}
        <button type="button" autoFocus onClick={onRestart}>
          Mulai ulang demo
        </button>
      </motion.section>
    </div>
  )
}
