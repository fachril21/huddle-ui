import { ChartColumn, MessageCircle, ShieldCheck, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import type { PanelName } from '../state/types'
import styles from './PanelPill.module.css'

interface PanelPillProps {
  active: PanelName | null
  participantCount: number
  unreadChat: number
  onSelect: (panel: PanelName) => void
}

const ICON = { size: 20, strokeWidth: 1.75, 'aria-hidden': true } as const

/** Bottom-right glass-1 pill that opens the side panels (panels themselves arrive in M7). */
export function PanelPill({ active, participantCount, unreadChat, onSelect }: PanelPillProps) {
  const items: { name: PanelName; label: string; icon: ReactNode; badge?: number }[] = [
    { name: 'peserta', label: 'Peserta', icon: <Users {...ICON} />, badge: participantCount },
    { name: 'chat', label: 'Chat', icon: <MessageCircle {...ICON} />, badge: unreadChat },
    { name: 'polling', label: 'Polling', icon: <ChartColumn {...ICON} /> },
    { name: 'host', label: 'Alat host', icon: <ShieldCheck {...ICON} /> },
  ]

  return (
    <div className={`glass-1 ${styles.pill}`} role="group" aria-label="Panel samping">
      {items.map(({ name, label, icon, badge }) => (
        <button
          key={name}
          type="button"
          className={styles.btn}
          aria-pressed={active === name}
          aria-label={badge ? `${label}, ${badge}` : label}
          onClick={() => onSelect(name)}
        >
          {icon}
          {badge ? <span className={styles.badge}>{badge}</span> : null}
          <span role="tooltip" className={`glass-1 ${styles.tip}`}>{label}</span>
        </button>
      ))}
    </div>
  )
}
