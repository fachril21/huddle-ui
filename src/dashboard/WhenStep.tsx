import { useMemo, useState } from 'react'
import { addDays, busyOnDay, conflictAt, daysWithMeetings, formatRange, monthOf, nextMonday, zoneShortName } from './calendar'
import type { DayKey } from './calendar'
import { DURATIONS_MIN, TIMEZONES } from './constants'
import { DatePicker } from './DatePicker'
import { recurrenceLabel, utcToZoned, zonedToUtc } from './schedule'
import type { FormState } from './scheduleForm'
import { TimeSlots } from './TimeSlots'
import type { Meeting, Recurrence } from './types'
import ui from './ui.module.css'
import styles from './WhenStep.module.css'

const RECURRENCES: readonly Recurrence[] = ['none', 'daily', 'weekly', 'monthly']
const ONE_MIN = 60_000

interface WhenStepProps {
  form: FormState
  now: Date
  meetings: readonly Meeting[]
  /** The meeting being edited, so it does not clash with itself */
  excludeId?: string
  /** A whole series keeps the date it started on */
  fixedDate: boolean
  recurrenceLocked: boolean
  errors: { when?: string; duration?: string }
  onChange: (next: Partial<FormState>) => void
}

export function minutesLabel(min: number): string {
  if (min < 60) return `${min} menit`
  const h = min / 60
  return Number.isInteger(h) ? `${h} jam` : `${Math.floor(h)} jam ${min % 60} menit`
}

/** Everything about "when": the day, the start time, how long, which zone, how often. */
export function WhenStep({ form, now, meetings, excludeId, fixedDate, recurrenceLocked, errors, onChange }: WhenStepProps) {
  const [month, setMonth] = useState(() => monthOf(form.date))
  const today = utcToZoned(now, form.timezone).date
  const marked = useMemo(() => daysWithMeetings(meetings, month, form.timezone, excludeId), [meetings, month, form.timezone, excludeId])
  const busy = useMemo(() => busyOnDay(meetings, form.date, form.timezone, excludeId), [meetings, form.date, form.timezone, excludeId])
  const clash = conflictAt(busy, zonedToUtc(form.date, form.time, form.timezone).getTime(), form.durationMin)
  const durations = DURATIONS_MIN.includes(form.durationMin as (typeof DURATIONS_MIN)[number]) ? DURATIONS_MIN : [...DURATIONS_MIN, form.durationMin].sort((a, b) => a - b)

  const pick = (date: DayKey) => {
    onChange({ date })
    setMonth(monthOf(date))
  }
  const quick: { label: string; date: DayKey }[] = [
    { label: 'Hari ini', date: today },
    { label: 'Besok', date: addDays(today, 1) },
    { label: 'Senin depan', date: nextMonday(today) },
  ]
  const slotsPast = zonedToUtc(form.date, '23:59', form.timezone).getTime() < now.getTime() - ONE_MIN

  return (
    <div className={styles.when}>
      <div className={styles.quick} role="group" aria-label="Pilih cepat">
        {quick.map((q) => (
          <button key={q.label} type="button" className={`${ui.btn} ${ui.small}`} aria-pressed={form.date === q.date} disabled={fixedDate} onClick={() => pick(q.date)}>
            {q.label}
          </button>
        ))}
      </div>

      <div className={styles.panes}>
        <DatePicker value={form.date} min={today} today={today} month={month} marked={marked} disabled={fixedDate} onMonthChange={setMonth} onSelect={pick} />

        <fieldset id="sch-when" className={styles.times} tabIndex={-1}>
          <legend className={ui.label}>Jam mulai · {zoneShortName(form.timezone)}</legend>
          <div className={styles.slotsBox}>
            <TimeSlots name="sch-time" date={form.date} tz={form.timezone} value={form.time} durationMin={form.durationMin} now={now} busy={busy} onChange={(time) => onChange({ time })} />
          </div>
          <div className={styles.custom}>
            <label htmlFor="sch-time-custom">Jam lain</label>
            <input
              id="sch-time-custom"
              className={ui.input}
              type="time"
              step={300}
              value={form.time}
              aria-invalid={errors.when ? true : undefined}
              aria-describedby="sch-when-note"
              onChange={(e) => e.target.value && onChange({ time: e.target.value })}
            />
          </div>
        </fieldset>
      </div>

      <div id="sch-when-note" className={styles.notes} aria-live="polite">
        {fixedDate && <p className={ui.hint}>Seri tetap mulai dari tanggal awalnya. Jam bisa diubah.</p>}
        {errors.when && (
          <p className={ui.error} role="alert">
            {errors.when}
          </p>
        )}
        {!errors.when && slotsPast && <p className={ui.hint}>Hari ini sudah habis. Pilih tanggal lain.</p>}
        {!errors.when && clash && (
          <p className={styles.clash}>
            Bentrok dengan “{clash.title}”. Tetap bisa disimpan.
          </p>
        )}
      </div>

      <div className={styles.trio}>
        <div>
          <label className={ui.label} htmlFor="sch-duration">
            Durasi
          </label>
          <select id="sch-duration" className={ui.input} value={form.durationMin} aria-invalid={errors.duration ? true : undefined} onChange={(e) => onChange({ durationMin: Number(e.target.value) })}>
            {durations.map((d) => (
              <option key={d} value={d}>
                {minutesLabel(d)}
              </option>
            ))}
          </select>
          <p className={errors.duration ? ui.error : ui.hint} role={errors.duration ? 'alert' : undefined}>
            {errors.duration ?? `Selesai ${formatRange(form.date, form.time, form.durationMin, form.timezone).split('–')[1]}`}
          </p>
        </div>
        <div>
          <label className={ui.label} htmlFor="sch-tz">
            Zona waktu
          </label>
          <select id="sch-tz" className={ui.input} value={form.timezone} onChange={(e) => onChange({ timezone: e.target.value })}>
            {TIMEZONES.map((tz) => (
              <option key={tz.id} value={tz.id}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={ui.label} htmlFor="sch-repeat">
            Berulang
          </label>
          <select id="sch-repeat" className={ui.input} value={form.recurrence} disabled={recurrenceLocked} onChange={(e) => onChange({ recurrence: e.target.value as Recurrence })}>
            {RECURRENCES.map((r) => (
              <option key={r} value={r}>
                {r === 'none' ? 'Tidak berulang' : recurrenceLabel(r)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
