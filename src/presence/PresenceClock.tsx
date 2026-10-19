import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

const TICK_MS = 5000

const PresenceClock = createContext(0)

/** One slow clock for every "pergi 4 mnt" on screen; it only runs while someone is away, and only its readers re-render. */
export function PresenceClockProvider({ active, children }: { active: boolean; children: ReactNode }) {
  const [now, setNow] = useState(() => performance.now())

  useEffect(() => {
    if (!active) return
    const tick = () => setNow(performance.now())
    tick()
    const id = window.setInterval(tick, TICK_MS)
    return () => window.clearInterval(id)
  }, [active])

  return <PresenceClock.Provider value={now}>{children}</PresenceClock.Provider>
}

export const usePresenceNow = (): number => useContext(PresenceClock)
