import { useLayoutEffect, useRef } from 'react'
import { conflictAt, slotTimes } from './calendar'
import type { Busy, DayKey } from './calendar'
import { zonedToUtc } from './schedule'
import styles from './TimeSlots.module.css'

const SLOTS = slotTimes()

interface TimeSlotsProps {
  name: string
  date: DayKey
  tz: string
  value: string
  durationMin: number
  now: Date
  busy: readonly Busy[]
  onChange: (time: string) => void
}

/** Half hour start times for the chosen day as a radio group, so the arrow keys move and select. */
export function TimeSlots({ name, date, tz, value, durationMin, now, busy, onChange }: TimeSlotsProps) {
  const listRef = useRef<HTMLDivElement>(null)

  // bring the chosen slot (or the first one still ahead) into view when the day changes
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const target = list.querySelector<HTMLElement>('[data-chosen]') ?? list.querySelector<HTMLElement>('[data-open]')
    if (target) list.scrollTop = Math.max(0, target.offsetTop - list.clientHeight / 2 + target.offsetHeight / 2)
    // only the day should move the list; picking a slot must not make it jump
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, tz])

  return (
    <div ref={listRef} role="radiogroup" aria-label="Jam mulai" className={styles.list}>
      {SLOTS.map((time) => {
        const startMs = zonedToUtc(date, time, tz).getTime()
        const past = startMs < now.getTime()
        const clash = past ? undefined : conflictAt(busy, startMs, durationMin)
        const chosen = time === value
        return (
          <label key={time} className={styles.slot} data-chosen={chosen || undefined} data-open={past ? undefined : true} data-past={past || undefined} data-clash={clash ? true : undefined}>
            <input type="radio" name={name} value={time} checked={chosen} disabled={past} onChange={() => onChange(time)} />
            <span className={styles.time}>{time}</span>
            {clash && (
              <>
                <span className={styles.clash} aria-hidden="true">
                  Bentrok
                </span>
                <span className="sr-only">, bentrok dengan {clash.title}</span>
              </>
            )}
          </label>
        )
      })}
    </div>
  )
}
