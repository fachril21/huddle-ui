import { Wifi, WifiOff } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { USER_NAME } from './constants'
import { paletteFor } from './people'
import { formatClock, formatLongDay, greetingFor } from './schedule'
import styles from './Header.module.css'

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

const readOnline = () => navigator.onLine

/** Greeting, today's date, a live clock, connection state and who is signed in. */
export function Header({ now }: { now: Date }) {
  const online = useSyncExternalStore(subscribeOnline, readOnline, () => true)
  return (
    <header className={styles.header}>
      <div>
        <h1>
          {greetingFor(now)}, {USER_NAME}
        </h1>
        <p className={styles.date}>{formatLongDay(now)}</p>
      </div>

      <div className={styles.side}>
        <p className={styles.clock} aria-label={`Pukul ${formatClock(now)} WIB`}>
          <time dateTime={now.toISOString()}>{formatClock(now)}</time>
          <span>WIB</span>
        </p>
        <span className={styles.net} data-online={online} role="status">
          {online ? <Wifi size={14} strokeWidth={1.75} aria-hidden="true" /> : <WifiOff size={14} strokeWidth={1.75} aria-hidden="true" />}
          {online ? 'Terhubung' : 'Tidak ada koneksi'}
        </span>
        <span className={styles.profile} data-palette={paletteFor(USER_NAME)}>
          <span className={styles.avatar} aria-hidden="true">
            {USER_NAME.charAt(0)}
          </span>
          {USER_NAME}
        </span>
      </div>
    </header>
  )
}
