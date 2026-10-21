import { LogOut, Wifi, WifiOff } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { useCurrentUser } from '../auth/CurrentUser'
import { Menu } from './Menu'
import type { MenuItem } from './Menu'
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

/** Greeting, today's date, a live clock, connection state and who is signed in (with the way out). */
export function Header({ now }: { now: Date }) {
  const online = useSyncExternalStore(subscribeOnline, readOnline, () => true)
  const { name, email, signOut } = useCurrentUser()

  const profile = (
    <>
      <span className={styles.avatar} aria-hidden="true">
        {name.charAt(0)}
      </span>
      {name}
    </>
  )
  const items: MenuItem[] = signOut ? [{ id: 'sign-out', label: 'Keluar', description: email, icon: <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />, tone: 'danger', onSelect: signOut }] : []

  return (
    <header className={styles.header}>
      <div>
        <h1>
          {greetingFor(now)}, {name}
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
        {signOut ? (
          <Menu
            items={items}
            align="end"
            width={260}
            title="Akun"
            trigger={(props, open) => (
              <button {...props} type="button" className={styles.profile} data-palette={paletteFor(name)} data-open={open || undefined} aria-label={`Akun ${name}`}>
                {profile}
              </button>
            )}
          />
        ) : (
          <span className={styles.profile} data-palette={paletteFor(name)}>
            {profile}
          </span>
        )}
      </div>
    </header>
  )
}
