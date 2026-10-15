import { useEffect, useState } from 'react'

const DEFAULT_TICK_MS = 15_000

/** The current time, refreshed on an interval so countdowns and the clock stay honest. */
export function useNow(tickMs: number = DEFAULT_TICK_MS): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), tickMs)
    return () => window.clearInterval(id)
  }, [tickMs])
  return now
}
