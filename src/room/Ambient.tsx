import styles from './Ambient.module.css'

/** Design.md 5: base + 4 drifting mesh blobs + grain + vignette. Deliberately faint. */
export function Ambient() {
  return (
    <div className={styles.ambient} aria-hidden="true">
      <i className={`${styles.blob} ${styles.a}`} />
      <i className={`${styles.blob} ${styles.b}`} />
      <i className={`${styles.blob} ${styles.c}`} />
      <i className={`${styles.blob} ${styles.d}`} />
      <div className={styles.grain} />
      <div className={styles.vignette} />
    </div>
  )
}
