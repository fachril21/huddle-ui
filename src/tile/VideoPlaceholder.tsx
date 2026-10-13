import styles from './VideoPlaceholder.module.css'

/** Self-made stand-in for a camera feed: abstract silhouette over a very slowly moving gradient. */
export function VideoPlaceholder() {
  return (
    <div className={styles.video} aria-hidden="true">
      <div className={styles.wash} />
      <svg className={styles.figure} viewBox="0 0 160 100" preserveAspectRatio="xMidYMax meet">
        <ellipse cx="80" cy="115" rx="52" ry="42" />
        <circle cx="80" cy="46" r="21" />
      </svg>
    </div>
  )
}
