import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './GridPager.module.css'

interface GridPagerProps {
  page: number
  pages: number
  /** Someone on another page is speaking: show a small glowing dot on the pager (PRD 6.6) */
  speakingElsewhere: boolean
  onPage: (page: number) => void
}

/** Top-right pager for rooms with more than 9 people. */
export function GridPager({ page, pages, speakingElsewhere, onPage }: GridPagerProps) {
  return (
    <nav className={`glass-1 ${styles.pager}`} aria-label="Halaman peserta">
      <button type="button" aria-label="Halaman sebelumnya" disabled={page === 0} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <span aria-live="polite">
        {page + 1}/{pages}
      </span>
      <button type="button" aria-label={speakingElsewhere ? 'Halaman berikutnya, ada yang bicara' : 'Halaman berikutnya'} disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>
        <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
        {speakingElsewhere && <i className={styles.dot} aria-hidden="true" />}
      </button>
    </nav>
  )
}
