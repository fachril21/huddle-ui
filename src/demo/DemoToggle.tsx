import styles from './DemoToggle.module.css'

/** Small "Demo" button, top-left (PRD 9). Opens and closes the Demo Director panel. */
export function DemoToggle({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button type="button" className={styles.btn} aria-pressed={open} aria-label="Demo Director (Shift+D)" onClick={onClick}>
      Demo
    </button>
  )
}
