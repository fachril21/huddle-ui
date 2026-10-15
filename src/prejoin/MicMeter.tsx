import { useEffect, useRef } from 'react'
import { litBars } from './micLevel'
import type { MicLevel } from './useMicLevel'
import styles from './MicMeter.module.css'

const BARS = 16

/** Segmented input meter. Updates the DOM straight from the level stream, so speech never re-renders React. */
export function MicMeter({ mic, active }: { mic: MicLevel; active: boolean }) {
  const barsRef = useRef<HTMLSpanElement>(null)
  const { subscribe } = mic

  useEffect(() => {
    const bars = barsRef.current?.children
    if (!bars) return
    let last = -1
    const paint = (lit: number) => {
      if (lit === last) return
      last = lit
      for (let i = 0; i < bars.length; i++) bars[i].toggleAttribute('data-lit', i < lit)
    }
    paint(0)
    return subscribe((level) => paint(active ? litBars(level, BARS) : 0))
  }, [subscribe, active])

  return (
    <span ref={barsRef} className={styles.meter} data-active={active} role="presentation">
      {Array.from({ length: BARS }, (_, i) => (
        <i key={i} data-zone={i < 11 ? 'low' : i < 14 ? 'mid' : 'high'} />
      ))}
    </span>
  )
}
