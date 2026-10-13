import type { ReactNode } from 'react'
import styles from './DemoDirector.module.css'

/** Mono toggle button used across the Demo Director. `on` undefined means a plain action button. */
export function Toggle({ label, on, onClick }: { label: string; on?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={styles.btn} aria-pressed={on} onClick={onClick}>
      {label}
    </button>
  )
}

/** Collapsible group so the long panel stays scannable. */
export function Group({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details className={styles.group} open={defaultOpen}>
      <summary>{title}</summary>
      <div className={styles.groupBody}>{children}</div>
    </details>
  )
}
