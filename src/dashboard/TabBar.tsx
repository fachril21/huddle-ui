import type { DashboardView } from './Rail'
import { NAV_ENTRIES } from './Rail'
import styles from './TabBar.module.css'

interface TabBarProps {
  view: DashboardView
  onChange: (view: DashboardView) => void
  recordingLive?: boolean
}

/** Bottom navigation for phones: within thumb reach, four fixed places, the same ones as the desktop rail. */
export function TabBar({ view, onChange, recordingLive }: TabBarProps) {
  return (
    <nav className={`glass-2 ${styles.bar}`} aria-label="Menu utama">
      {NAV_ENTRIES.map((tab) => (
        <button key={tab.view} type="button" className={styles.tab} aria-current={tab.view === view ? 'page' : undefined} onClick={() => onChange(tab.view)}>
          {tab.icon}
          <span>{tab.label}</span>
          {tab.view === 'recordings' && recordingLive && (
            <>
              <i className={styles.live} aria-hidden="true" />
              <span className="sr-only">Sedang merekam</span>
            </>
          )}
        </button>
      ))}
    </nav>
  )
}
