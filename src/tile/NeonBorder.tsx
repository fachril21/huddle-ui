import styles from './NeonBorder.module.css'

/**
 * Neon edge for lit tiles (Design.md 6): a 2px masked ring with a comet orbiting it, layered glow outside.
 * The dominant speaker gets a second comet 180 degrees opposite and a wider glow (not in the lighter tiers).
 */
export function NeonBorder({ dominant, simple }: { dominant: boolean; simple: boolean }) {
  return (
    <div className={styles.neon} aria-hidden="true">
      <div className={styles.glowOut} />
      {!simple && <div className={styles.glowDominant} data-on={dominant} />}
      <div className={styles.ring}>
        <div className={styles.spark}>
          <div className={styles.orbit}>
            <div className={styles.comet} />
            {!simple && <div className={`${styles.comet} ${styles.opposite}`} data-on={dominant} />}
          </div>
        </div>
      </div>
    </div>
  )
}
