import styles from './ScreenMock.module.css'

const SPARK = '0,28 14,22 28,25 42,14 56,18 70,8 84,12 100,4'
const BARS = [38, 52, 44, 66, 58, 78, 70, 92]
const ROWS = [86, 64, 78, 52, 70]

/** Invented, abstract "shared screen": a light sprint dashboard. No real data or brands. */
export function ScreenMock() {
  return (
    <div className={styles.screen} aria-hidden="true">
      <aside className={styles.nav}>
        <i className={styles.logo} />
        {Array.from({ length: 5 }, (_, i) => (
          <i key={i} className={styles.navItem} data-active={i === 1} />
        ))}
      </aside>
      <div className={styles.main}>
        <header className={styles.top}>
          <h2>Ringkasan sprint</h2>
          <span className={styles.search} />
          <span className={styles.avatars}><i /><i /><i /></span>
        </header>

        <div className={styles.stats}>
          {['Tugas selesai', 'Kecepatan tim', 'Bug terbuka', 'Rilis berikutnya'].map((label, i) => (
            <div key={label} className={styles.card}>
              <span className={styles.cardLabel}>{label}</span>
              <b className={styles.cardValue} style={{ width: `${46 + i * 9}%` }} />
              <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={styles.spark}>
                <polyline points={SPARK} style={{ transform: `translateY(${i * 2}px)` }} />
              </svg>
            </div>
          ))}
        </div>

        <div className={styles.charts}>
          <div className={`${styles.card} ${styles.wide}`}>
            <span className={styles.cardLabel}>Burndown</span>
            <svg viewBox="0 0 200 80" preserveAspectRatio="none" className={styles.area}>
              <defs>
                <linearGradient id="mock-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" className={styles.stopA} />
                  <stop offset="100%" className={styles.stopB} />
                </linearGradient>
              </defs>
              <path d="M0 14 C30 18 40 30 70 34 S120 52 150 58 S185 70 200 72 L200 80 L0 80Z" fill="url(#mock-area)" />
              <path d="M0 14 C30 18 40 30 70 34 S120 52 150 58 S185 70 200 72" className={styles.line} />
            </svg>
          </div>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Beban kerja</span>
            <div className={styles.bars}>
              {BARS.map((h, i) => (
                <i key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>

        <div className={`${styles.card} ${styles.table}`}>
          {ROWS.map((w, i) => (
            <div key={i} className={styles.row}>
              <i className={styles.dot} />
              <b style={{ width: `${w * 0.5}%` }} />
              <span style={{ width: `${w * 0.22}%` }} />
              <em />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
