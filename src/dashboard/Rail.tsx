import { CalendarDays, Clapperboard, House, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './Rail.module.css'

export type DashboardView = 'home' | 'meetings' | 'recordings' | 'settings'

interface RailProps {
  view: DashboardView
  onChange: (view: DashboardView) => void
  /** A recording is being made right now: a small mark on Rekaman says so */
  recordingLive?: boolean
}

const ICON = { size: 20, strokeWidth: 1.75, 'aria-hidden': true } as const

interface Entry {
  readonly view: DashboardView
  readonly label: string
  readonly icon: ReactNode
}

export const NAV_ENTRIES: readonly Entry[] = [
  { view: 'home', label: 'Beranda', icon: <House {...ICON} /> },
  { view: 'meetings', label: 'Rapat', icon: <CalendarDays {...ICON} /> },
  { view: 'recordings', label: 'Rekaman', icon: <Clapperboard {...ICON} /> },
  { view: 'settings', label: 'Pengaturan', icon: <Settings {...ICON} /> },
]

/** Icon rail: Beranda, Rapat, Rekaman, Pengaturan. */
export function Rail({ view, onChange, recordingLive }: RailProps) {
  return (
    <nav className={styles.rail} aria-label="Menu utama">
      <span className={styles.wordmark}>Huddle</span>
      <ul>
        {NAV_ENTRIES.map((entry) => (
          <li key={entry.view}>
            <button type="button" className={styles.item} aria-current={entry.view === view ? 'page' : undefined} onClick={() => onChange(entry.view)}>
              {entry.icon}
              <span>{entry.label}</span>
              {entry.view === 'recordings' && recordingLive && (
                <>
                  <i className={styles.live} aria-hidden="true" />
                  <span className="sr-only">Sedang merekam</span>
                </>
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
