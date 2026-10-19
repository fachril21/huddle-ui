import { Clock, Hourglass, TriangleAlert } from 'lucide-react'
import { RETENTION_MS, formatRemaining, urgencyOf } from './retention'
import type { Urgency } from './types'
import styles from './Countdown.module.css'

const ICON = { size: 14, strokeWidth: 1.75, 'aria-hidden': true } as const

const ICONS: Record<Urgency, typeof Clock> = { calm: Clock, soon: Hourglass, urgent: TriangleAlert }
const NOTE: Record<Urgency, string> = { calm: 'Tersisa', soon: 'Tersisa', urgent: 'Segera dihapus' }

interface CountdownProps {
  /** Milliseconds until the file is deleted */
  remaining: number
  /** Big form used in the detail view */
  large?: boolean
}

/** Time left before deletion: icon, words and a draining bar, so urgency never rides on color alone. */
export function Countdown({ remaining, large }: CountdownProps) {
  const urgency = urgencyOf(remaining)
  const Icon = ICONS[urgency]
  const share = Math.min(1, Math.max(0, remaining / RETENTION_MS))
  return (
    <div className={styles.root} data-urgency={urgency} data-large={large || undefined}>
      <span className={styles.line}>
        <Icon {...ICON} />
        <span className={styles.note}>{NOTE[urgency]}</span>
        <span className={styles.time}>{formatRemaining(remaining)}</span>
      </span>
      <span className={styles.track} aria-hidden="true">
        <i style={{ transform: `scaleX(${share})` }} />
      </span>
    </div>
  )
}
