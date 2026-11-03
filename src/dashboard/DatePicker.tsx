import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { addDays, addMonths, formatDay, formatMonth, monthGrid, monthOf, shiftMonth, weekdayIndex } from './calendar'
import type { DayKey, MonthKey } from './calendar'
import ui from './ui.module.css'
import styles from './DatePicker.module.css'

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] as const
const STEP_KEYS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }

interface DatePickerProps {
  value: DayKey
  /** First day that can be picked (today in the meeting's zone) */
  min: DayKey
  today: DayKey
  month: MonthKey
  /** Days that already have a meeting */
  marked: ReadonlySet<DayKey>
  disabled?: boolean
  onMonthChange: (month: MonthKey) => void
  onSelect: (day: DayKey) => void
}

/** Where a key press sends focus, or null for keys the grid ignores. */
function targetFor(key: string, from: DayKey): DayKey | null {
  if (key in STEP_KEYS) return addDays(from, STEP_KEYS[key])
  if (key === 'PageUp') return shiftMonth(from, -1)
  if (key === 'PageDown') return shiftMonth(from, 1)
  if (key === 'Home') return addDays(from, -weekdayIndex(from))
  if (key === 'End') return addDays(from, 6 - weekdayIndex(from))
  return null
}

/** A month grid you can drive with the arrow keys. One tab stop; days before `min` are disabled. */
export function DatePicker({ value, min, today, month, marked, disabled, onMonthChange, onSelect }: DatePickerProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const pendingFocus = useRef<DayKey | null>(null)
  const weeks = monthGrid(month)
  const canGoBack = addMonths(month, -1) >= monthOf(min)
  const firstPickable = `${month}-01` < min ? min : `${month}-01`
  const tabDay = monthOf(value) === month && value >= min ? value : monthOf(firstPickable) === month ? firstPickable : null

  const focusDay = (key: DayKey) => {
    if (monthOf(key) !== month) {
      pendingFocus.current = key
      onMonthChange(monthOf(key))
      return
    }
    gridRef.current?.querySelector<HTMLElement>(`[data-day="${key}"]`)?.focus()
  }

  useEffect(() => {
    if (!pendingFocus.current) return
    gridRef.current?.querySelector<HTMLElement>(`[data-day="${pendingFocus.current}"]`)?.focus()
    pendingFocus.current = null
  }, [month])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const from = (document.activeElement as HTMLElement | null)?.dataset.day
    if (!from) return
    const target = targetFor(e.key, from)
    if (!target) return
    e.preventDefault()
    focusDay(target < min ? min : target)
  }

  return (
    <div className={styles.picker} data-disabled={disabled || undefined}>
      <div className={styles.head}>
        <h3 className={styles.month} aria-live="polite">
          {formatMonth(month)}
        </h3>
        <div className={styles.nav}>
          <button type="button" className={`${ui.btn} ${ui.icon}`} onClick={() => onMonthChange(addMonths(month, -1))} disabled={!canGoBack || disabled} aria-label="Bulan sebelumnya">
            <ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button type="button" className={`${ui.btn} ${ui.icon}`} onClick={() => onMonthChange(addMonths(month, 1))} disabled={disabled} aria-label="Bulan berikutnya">
            <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div ref={gridRef} role="grid" aria-label={`Pilih tanggal, ${formatMonth(month)}`} className={styles.grid} onKeyDown={onKeyDown}>
        <div role="row" className={styles.row}>
          {WEEKDAYS.map((d) => (
            <span key={d} role="columnheader" className={styles.weekday}>
              {d}
            </span>
          ))}
        </div>
        {weeks.map((week, w) => (
          <div key={w} role="row" className={styles.row}>
            {week.map((day, i) =>
              day === null ? (
                <span key={i} role="gridcell" aria-hidden="true" />
              ) : (
                <button
                  key={day}
                  type="button"
                  role="gridcell"
                  className={styles.day}
                  data-day={day}
                  data-today={day === today || undefined}
                  data-marked={marked.has(day) || undefined}
                  data-autofocus={day === value || undefined}
                  aria-selected={day === value}
                  aria-current={day === today ? 'date' : undefined}
                  aria-label={`${formatDay(day)}${marked.has(day) ? ', sudah ada rapat' : ''}`}
                  tabIndex={day === tabDay ? 0 : -1}
                  disabled={disabled || day < min}
                  onClick={() => onSelect(day)}
                >
                  <span>{Number(day.slice(8))}</span>
                </button>
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
