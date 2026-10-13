import styles from './Aurora.module.css'

/**
 * Camera-off speaking effect (Design.md 7.2): three palette blobs orbiting behind the avatar,
 * one swaying aurora curtain, and a ripple ring the engine fires on loud peaks.
 * Rendered only while the tile is lit. Intensity comes from CSS variables the engine writes.
 */
export function Aurora() {
  return (
    <div className={styles.aurora} aria-hidden="true">
      <div className={styles.entry}>
        <div className={styles.curtain} />
        <div className={`${styles.scaler} ${styles.s1}`}><i className={`${styles.blob} ${styles.b1}`} /></div>
        <div className={`${styles.scaler} ${styles.s2}`}><i className={`${styles.blob} ${styles.b2}`} /></div>
        <div className={`${styles.scaler} ${styles.s3}`}><i className={`${styles.blob} ${styles.b3}`} /></div>
      </div>
      <span className={styles.ring} data-ring />
    </div>
  )
}
