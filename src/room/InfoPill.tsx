import { useEffect, useState } from 'react'
import styles from './InfoPill.module.css'

const MEETING_TITLE = 'Brainstorm sprint'
const MEETING_CODE = 'abc-defg-hij'
/** The mock meeting is already a few minutes in. */
const START_OFFSET_S = 12 * 60 + 34

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Bottom-left glass-1 pill: title, meeting code (mono), elapsed timer. */
export function InfoPill() {
  const [elapsed, setElapsed] = useState(START_OFFSET_S)

  useEffect(() => {
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className={`glass-1 ${styles.pill}`}>
      <span className={styles.title}>{MEETING_TITLE}</span>
      <span className={styles.meta}>
        <span>{MEETING_CODE}</span>
        <span className={styles.dot} aria-hidden="true" />
        <time>{formatElapsed(elapsed)}</time>
      </span>
    </div>
  )
}
