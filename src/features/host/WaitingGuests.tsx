import { useEffect, useState } from 'react'
import type { Guest } from '../../state/types'
import { waitedLabel } from '../../waiting/admission'
import styles from './WaitingGuests.module.css'

interface WaitingGuestsProps {
  guests: readonly Guest[]
  onDecide: (guestId: string, admit: boolean) => void
  onAdmitAll: () => void
  /** What to say when nobody is waiting. Omit to render nothing in that case. */
  emptyText?: string
}

const TICK_MS = 1000

/** performance.now(), refreshed every second while someone is waiting, so "menunggu 0:42" keeps counting */
function useClock(active: boolean): number {
  const [clock, setClock] = useState(() => performance.now())
  useEffect(() => {
    if (!active) return
    setClock(performance.now())
    const id = window.setInterval(() => setClock(performance.now()), TICK_MS)
    return () => window.clearInterval(id)
  }, [active])
  return clock
}

/** The people at the door: who they are, how long they have waited, and the way to answer. Used by the host panel and the participants panel. */
export function WaitingGuests({ guests, onDecide, onAdmitAll, emptyText }: WaitingGuestsProps) {
  const clock = useClock(guests.length > 0)
  if (guests.length === 0) return emptyText ? <p className={styles.empty}>{emptyText}</p> : null

  return (
    <section aria-label="Tamu menunggu">
      <div className={styles.head}>
        <h3>Tamu menunggu ({guests.length})</h3>
        {guests.length > 1 && (
          <button type="button" className={styles.all} onClick={onAdmitAll}>
            Izinkan semua
          </button>
        )}
      </div>
      <ul className={styles.list}>
        {guests.map((g) => (
          <li key={g.id}>
            <span className={styles.who}>
              <span className={styles.name}>{g.name}</span>
              <span className={styles.waited}>menunggu {waitedLabel(clock - g.at)}</span>
            </span>
            <button type="button" className={styles.deny} aria-label={`Tolak ${g.name}`} onClick={() => onDecide(g.id, false)}>
              Tolak
            </button>
            <button type="button" className={styles.admit} aria-label={`Izinkan ${g.name}`} onClick={() => onDecide(g.id, true)}>
              Izinkan
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
