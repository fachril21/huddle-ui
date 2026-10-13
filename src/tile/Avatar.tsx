import styles from './Avatar.module.css'

/** Initial on a palette gradient. Diameter is 28% of tile height, clamped 56-120px (Design.md 7.1). */
export function Avatar({ name }: { name: string }) {
  return (
    <div className={styles.avatar} data-avatar>
      <span className={styles.ring} />
      <span className={styles.initial} aria-hidden="true">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}
