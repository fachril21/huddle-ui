import { Shuffle } from 'lucide-react'
import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { useCurrentUser } from '../auth/CurrentUser'
import { DURATIONS_MIN, MY_ROOM_CODE, TIMEZONES } from './constants'
import { InviteeInput } from './InviteeInput'
import { generatePasscode } from './meetingCode'
import { Modal } from './Modal'
import { recurrenceLabel } from './schedule'
import { buildResult, initialForm, validateForm } from './scheduleForm'
import type { FormMode, FormSource, FormState, ScheduleResult } from './scheduleForm'
import type { Recurrence } from './types'
import ui from './ui.module.css'
import styles from './ScheduleDialog.module.css'

interface ScheduleDialogProps {
  mode: FormMode
  now: Date
  source?: FormSource
  onClose: () => void
  onSave: (result: ScheduleResult) => void
}

const TITLES: Record<FormMode, string> = { create: 'Jadwalkan rapat', edit: 'Ubah jadwal', duplicate: 'Duplikat rapat' }
const RECURRENCES: readonly Recurrence[] = ['none', 'daily', 'weekly', 'monthly']
const FIELD_ORDER = ['title', 'when', 'duration', 'invitees', 'passcode'] as const
const FIELD_IDS: Record<(typeof FIELD_ORDER)[number], string> = { title: 'sch-title', when: 'sch-date', duration: 'sch-duration', invitees: 'sch-invitees', passcode: 'sch-passcode' }

function minutesLabel(min: number): string {
  if (min < 60) return `${min} menit`
  const h = min / 60
  return Number.isInteger(h) ? `${h} jam` : `${Math.floor(h)} jam ${min % 60} menit`
}

/** Create, edit or duplicate a meeting. Mirrors Zoom's schedule form; the security switches are display only. */
export function ScheduleDialog({ mode, now, source, onClose, onSave }: ScheduleDialogProps) {
  const user = useCurrentUser()
  const [form, setForm] = useState<FormState>(() => initialForm(mode, now, source))
  const [submitted, setSubmitted] = useState(false)
  const uid = useId()
  const patch = (next: Partial<FormState>) => setForm((f) => ({ ...f, ...next }))

  const isSeriesEdit = mode === 'edit' && source !== undefined && source.meeting.recurrence !== 'none'
  const fixedDate = isSeriesEdit && form.scope === 'series'
  const errors = validateForm(form, mode, now, source !== undefined)
  const show = (key: keyof typeof errors) => (submitted ? errors[key] : undefined)

  const submit = () => {
    setSubmitted(true)
    const firstBad = FIELD_ORDER.find((k) => errors[k])
    if (firstBad) {
      document.getElementById(FIELD_IDS[firstBad])?.focus()
      return
    }
    onSave(buildResult(mode, form, source, undefined, user.name))
  }

  const durations = DURATIONS_MIN.includes(form.durationMin as (typeof DURATIONS_MIN)[number]) ? DURATIONS_MIN : [...DURATIONS_MIN, form.durationMin].sort((a, b) => a - b)

  return (
    <Modal
      title={TITLES[mode]}
      size="full"
      onClose={onClose}
      width={680}
      footer={
        <>
          <button type="button" className={ui.btn} onClick={onClose}>
            Batal
          </button>
          <button type="submit" form={`${uid}-form`} className={`${ui.btn} ${ui.primary}`}>
            {mode === 'edit' ? 'Simpan perubahan' : 'Simpan jadwal'}
          </button>
        </>
      }
    >
      <form
        id={`${uid}-form`}
        className={styles.form}
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        {isSeriesEdit && (
          <fieldset className={styles.scope}>
            <legend className={ui.label}>Yang diubah</legend>
            <label>
              <input type="radio" name={`${uid}-scope`} checked={form.scope === 'single'} onChange={() => patch({ scope: 'single' })} />
              Sesi ini saja
            </label>
            <label>
              <input type="radio" name={`${uid}-scope`} checked={form.scope === 'series'} onChange={() => patch({ scope: 'series' })} />
              Seluruh seri
            </label>
          </fieldset>
        )}

        <Field label="Judul" id="sch-title" error={show('title')}>
          <input
            id="sch-title"
            className={ui.input}
            type="text"
            autoComplete="off"
            data-autofocus={mode !== 'edit' || undefined}
            placeholder="Contoh: Sprint planning"
            value={form.title}
            aria-invalid={show('title') ? true : undefined}
            aria-describedby="sch-title-note"
            onChange={(e) => patch({ title: e.target.value })}
          />
        </Field>

        <Field label="Catatan" id="sch-desc" hint="Opsional. Ikut tercantum di undangan.">
          <textarea id="sch-desc" className={ui.input} rows={2} value={form.description} onChange={(e) => patch({ description: e.target.value })} />
        </Field>

        <div className={styles.when}>
          <Field label="Tanggal" id="sch-date" error={show('when')} hint={fixedDate ? 'Seri tetap mulai dari tanggal awalnya.' : undefined}>
            <input
              id="sch-date"
              className={ui.input}
              type="date"
              value={form.date}
              disabled={fixedDate}
              aria-invalid={show('when') ? true : undefined}
              aria-describedby="sch-date-note"
              onChange={(e) => patch({ date: e.target.value })}
            />
          </Field>
          <Field label="Mulai" id="sch-time">
            <input id="sch-time" className={ui.input} type="time" step={300} value={form.time} aria-invalid={show('when') ? true : undefined} onChange={(e) => patch({ time: e.target.value })} />
          </Field>
          <Field label="Durasi" id="sch-duration" error={show('duration')}>
            <select id="sch-duration" className={ui.input} value={form.durationMin} aria-invalid={show('duration') ? true : undefined} onChange={(e) => patch({ durationMin: Number(e.target.value) })}>
              {durations.map((d) => (
                <option key={d} value={d}>
                  {minutesLabel(d)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className={styles.pair}>
          <Field label="Zona waktu" id="sch-tz">
            <select id="sch-tz" className={ui.input} value={form.timezone} onChange={(e) => patch({ timezone: e.target.value })}>
              {TIMEZONES.map((tz) => (
                <option key={tz.id} value={tz.id}>
                  {tz.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Berulang" id="sch-repeat">
            <select
              id="sch-repeat"
              className={ui.input}
              value={form.recurrence}
              disabled={mode === 'edit' && form.scope === 'single' && isSeriesEdit}
              onChange={(e) => patch({ recurrence: e.target.value as Recurrence })}
            >
              {RECURRENCES.map((r) => (
                <option key={r} value={r}>
                  {r === 'none' ? 'Tidak berulang' : recurrenceLabel(r)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Undang peserta" id="sch-invitees" error={show('invitees')} bare>
          <InviteeInput id="sch-invitees" value={form.invitees} onChange={(invitees) => patch({ invitees })} error={show('invitees')} />
        </Field>

        <fieldset className={styles.group}>
          <legend className={ui.label}>Room</legend>
          <label className={styles.choice}>
            <input type="radio" name={`${uid}-room`} checked={form.room === 'auto'} onChange={() => patch({ room: 'auto' })} />
            <span>
              <strong>Kode baru otomatis</strong>
              <small>Dibuat saat jadwal disimpan.</small>
            </span>
          </label>
          <label className={styles.choice}>
            <input type="radio" name={`${uid}-room`} checked={form.room === 'mine'} onChange={() => patch({ room: 'mine' })} />
            <span>
              <strong>Room saya</strong>
              <small className={ui.mono}>{MY_ROOM_CODE}</small>
            </span>
          </label>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={ui.label}>Keamanan</legend>
          <p className={styles.note}>Tampilan saja di prototype ini: pengaturan ini tercatat tetapi belum ditegakkan saat peserta masuk.</p>
          <Switch label="Kode sandi" note="Peserta perlu kode ini untuk masuk." checked={form.passcodeOn} onChange={(passcodeOn) => patch({ passcodeOn })}>
            {form.passcodeOn && (
              <div className={styles.passcode}>
                <input
                  id="sch-passcode"
                  className={`${ui.input} ${ui.mono}`}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={8}
                  aria-label="Kode sandi"
                  aria-invalid={show('passcode') ? true : undefined}
                  value={form.passcode}
                  onChange={(e) => patch({ passcode: e.target.value.replace(/\D/g, '') })}
                />
                <button type="button" className={`${ui.btn} ${ui.icon}`} onClick={() => patch({ passcode: generatePasscode() })} aria-label="Acak kode sandi" title="Acak kode sandi">
                  <Shuffle size={16} strokeWidth={1.75} aria-hidden="true" />
                </button>
                {show('passcode') && <p className={ui.error}>{show('passcode')}</p>}
              </div>
            )}
          </Switch>
          <Switch label="Ruang tunggu" note="Host menyetujui peserta sebelum masuk." checked={form.waitingRoom} onChange={(waitingRoom) => patch({ waitingRoom })} />
          <Switch label="Matikan mikrofon dan kamera saat masuk" note="Peserta menyalakannya sendiri." checked={form.muteOnJoin} onChange={(muteOnJoin) => patch({ muteOnJoin })} />
        </fieldset>
      </form>
    </Modal>
  )
}

function Field({ label, id, hint, error, bare, children }: { label: string; id: string; hint?: string; error?: string; bare?: boolean; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <label className={ui.label} htmlFor={id}>
        {label}
      </label>
      {children}
      {!bare && (
        <p id={`${id}-note`} className={error ? ui.error : ui.hint} role={error ? 'alert' : undefined} hidden={!error && !hint}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

function Switch({ label, note, checked, onChange, children }: { label: string; note: string; checked: boolean; onChange: (next: boolean) => void; children?: ReactNode }) {
  const id = useId()
  return (
    <div className={styles.switchRow}>
      <div className={styles.switchText}>
        <label htmlFor={id}>{label}</label>
        <small>{note}</small>
        {children}
      </div>
      <button id={id} type="button" role="switch" aria-checked={checked} className={styles.switch} onClick={() => onChange(!checked)}>
        <span aria-hidden="true" />
        <span className="sr-only">{checked ? 'Aktif' : 'Nonaktif'}</span>
      </button>
    </div>
  )
}
