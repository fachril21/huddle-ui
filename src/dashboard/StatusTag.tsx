import { Check, Clock, DoorOpen, Radio } from 'lucide-react'
import type { ReactNode } from 'react'
import type { OccurrenceState } from './types'
import styles from './StatusTag.module.css'

const ICON = { size: 14, strokeWidth: 1.75, 'aria-hidden': true } as const

const TAGS: Record<OccurrenceState, { label: string; icon: ReactNode }> = {
  upcoming: { label: 'Terjadwal', icon: <Clock {...ICON} /> },
  joinable: { label: 'Bisa masuk', icon: <DoorOpen {...ICON} /> },
  live: { label: 'Berlangsung', icon: <Radio {...ICON} /> },
  ended: { label: 'Selesai', icon: <Check {...ICON} /> },
}

/** Icon plus word, so state never rides on color alone. */
export function StatusTag({ state, label }: { state: OccurrenceState; label?: string }) {
  const tag = TAGS[state]
  return (
    <span className={styles.tag} data-state={state}>
      {tag.icon}
      {label ?? tag.label}
    </span>
  )
}
