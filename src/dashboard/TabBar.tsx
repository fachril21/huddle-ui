import { CalendarDays, Clapperboard, House, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import type { DashboardView } from './Rail'
import styles from './TabBar.module.css'

interface TabBarProps {
  view: DashboardView
  onChange: (view: DashboardView) => void
  /** Called when a page that does not exist yet is tapped */
  onSoon: (label: string) => void
}

const ICON = { size: 22, strokeWidth: 1.75, 'aria-hidden': true } as const

const TABS: readonly { view: DashboardView | null; label: string; icon: ReactNode }[] = [
  { view: 'home', label: 'Beranda', icon: <House {...ICON} /> },
  { view: 'meetings', label: 'Rapat', icon: <CalendarDays {...ICON} /> },
  { view: null, label: 'Rekaman', icon: <Clapperboard {...ICON} /> },
  { view: null, label: 'Pengaturan', icon: <Settings {...ICON} /> },
]

/** Bottom navigation for phones: within thumb reach, four fixed places, the same ones as the desktop rail. */
export function TabBar({ view, onChange, onSoon }: TabBarProps) {
  return (
    <nav className={`glass-2 ${styles.bar}`} aria-label="Menu utama">
      {TABS.map((tab) => (
        <button
          key={tab.label}
          type="button"
          className={styles.tab}
          aria-current={tab.view === view ? 'page' : undefined}
          aria-disabled={tab.view === null || undefined}
          data-soon={tab.view === null || undefined}
          onClick={() => (tab.view ? onChange(tab.view) : onSoon(tab.label))}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
