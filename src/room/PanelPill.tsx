import { ChartColumn, MessageCircle, ShieldCheck, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import type { PanelName } from '../state/types'
import { shortcutKey } from './shortcuts'
import type { ShortcutId } from './shortcuts'
import styles from './PanelPill.module.css'

interface PanelPillProps {
  active: PanelName | null
  participantCount: number
  unreadChat: number
  /** Unvoted active poll count shown as a badge on the Polling button */
  pendingPoll: number
  /** Alat host is only offered to Host and Co-host */
  showHost: boolean
  hostBadge: number
  onSelect: (panel: PanelName) => void
}

/** Panels that have a keyboard shortcut */
const PANEL_SHORTCUTS: Partial<Record<PanelName, ShortcutId>> = { peserta: 'participants', chat: 'chat' }

const ICON = { size: 20, strokeWidth: 1.75, 'aria-hidden': true } as const

/** Bottom-right glass-1 pill that opens the side panels . */
export function PanelPill({ active, participantCount, unreadChat, pendingPoll, showHost, hostBadge, onSelect }: PanelPillProps) {
  const items: { name: PanelName; label: string; icon: ReactNode; badge?: number }[] = [
    { name: 'peserta', label: 'Peserta', icon: <Users {...ICON} />, badge: participantCount },
    { name: 'chat', label: 'Chat', icon: <MessageCircle {...ICON} />, badge: unreadChat },
    { name: 'polling', label: 'Polling', icon: <ChartColumn {...ICON} />, badge: pendingPoll },
    ...(showHost ? [{ name: 'host' as const, label: 'Alat host', icon: <ShieldCheck {...ICON} />, badge: hostBadge }] : []),
  ]

  return (
    <div className={`glass-1 ${styles.pill}`} role="group" aria-label="Panel samping">
      {items.map(({ name, label, icon, badge }) => {
        const shortcutId = PANEL_SHORTCUTS[name]
        const key = shortcutId ? shortcutKey(shortcutId) : undefined
        return (
        <button
          key={name}
          data-panel-trigger={name}
          type="button"
          className={styles.btn}
          aria-pressed={active === name}
          aria-label={badge ? `${label}, ${badge}` : label}
          aria-keyshortcuts={key}
          onClick={() => onSelect(name)}
        >
          {icon}
          {badge ? <span className={styles.badge}>{badge}</span> : null}
          <span role="tooltip" className={`glass-1 ${styles.tip}`}>
            {label}
            {key && <kbd className="keycap">{key}</kbd>}
          </span>
        </button>
        )
      })}
    </div>
  )
}
