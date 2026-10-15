import { CalendarDays, Clapperboard, House, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './Rail.module.css'

export type DashboardView = 'home' | 'meetings'

interface RailProps {
  view: DashboardView
  onChange: (view: DashboardView) => void
}

const ICON = { size: 20, strokeWidth: 1.75, 'aria-hidden': true } as const

interface Entry {
  readonly view: DashboardView | null
  readonly label: string
  readonly icon: ReactNode
}

const ENTRIES: readonly Entry[] = [
  { view: 'home', label: 'Beranda', icon: <House {...ICON} /> },
  { view: 'meetings', label: 'Rapat', icon: <CalendarDays {...ICON} /> },
  { view: null, label: 'Rekaman', icon: <Clapperboard {...ICON} /> },
  { view: null, label: 'Pengaturan', icon: <Settings {...ICON} /> },
]

/** Icon rail. Rekaman and Pengaturan have no page yet: they say so instead of going nowhere. */
export function Rail({ view, onChange }: RailProps) {
  return (
    <nav className={styles.rail} aria-label="Menu utama">
      <span className={styles.wordmark}>Huddle</span>
      <ul>
        {ENTRIES.map((entry) => {
          const soon = entry.view === null
          return (
            <li key={entry.label}>
              <button
                type="button"
                className={styles.item}
                aria-current={entry.view === view ? 'page' : undefined}
                aria-disabled={soon || undefined}
                data-soon={soon || undefined}
                onClick={() => entry.view && onChange(entry.view)}
              >
                {entry.icon}
                <span>{entry.label}</span>
                {soon && <span className={styles.soon}>Segera hadir</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
