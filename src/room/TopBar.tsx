import { Signal } from 'lucide-react'
import styles from './TopBar.module.css'

/** Top-right connection chip (PRD 7.2). Record/lock badges are P2 and not built yet. */
export function TopBar() {
  return (
    <div className={styles.bar}>
      <div className={`glass-1 ${styles.chip}`}>
        <Signal size={16} strokeWidth={1.75} aria-hidden="true" />
        <span>Koneksi baik</span>
      </div>
    </div>
  )
}
