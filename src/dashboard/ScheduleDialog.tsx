import { CalendarDays, Shuffle } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import type { ReactNode } from 'react'
import { useCurrentUser } from '../auth/CurrentUser'
import { formatDay, formatRange, isDayKey, zoneShortName } from './calendar'
import { MY_ROOM_CODE } from './constants'
import { InviteeInput } from './InviteeInput'
import { generatePasscode } from './meetingCode'
import { Modal } from './Modal'
import { recurrenceLabel } from './schedule'
import { buildResult, initialForm, validateForm } from './scheduleForm'
import type { FormMode, FormSource, FormState, ScheduleResult } from './scheduleForm'
import type { Meeting } from './types'
import ui from './ui.module.css'
import { WhenStep } from './WhenStep'
import styles from './ScheduleDialog.module.css'

interface ScheduleDialogProps {
  mode: FormMode
  now: Date
  /** Existing meetings, so the time list can mark slots that clash */
  meetings: readonly Meeting[]
  source?: FormSource
  onClose: () => void
  onSave: (result: ScheduleResult) => void
}

type Step = 1 | 2

const TITLES: Record<FormMode, string> = { create: 'Jadwalkan rapat', edit: 'Ubah jadwal', duplicate: 'Duplikat rapat' }
const FIELD_ORDER = ['when', 'duration', 'title', 'invitees', 'passcode'] as const
const FIELD_IDS: Record<(typeof FIELD_ORDER)[number], string> = { when: 'sch-when', duration: 'sch-duration', title: 'sch-title', invitees: 'sch-invitees', passcode: 'sch-passcode' }

/**
 * Create walks through two steps: when (day, time, length), then the details. Edit and duplicate open on the details
 * with the time folded into a card, since most changes there leave the time alone.
 */
export function ScheduleDialog({ mode, now, meetings, source, onClose, onSave }: ScheduleDialogProps) {
  const user = useCurrentUser()
  const wizard = mode === 'create'
  const [form, setForm] = useState<FormState>(() => initialForm(mode, now, source))
  const [step, setStep] = useState<Step>(wizard ? 1 : 2)
  const [whenOpen, setWhenOpen] = useState(false)
  const [whenChecked, setWhenChecked] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const uid = useId()
  const patch = (next: Partial<FormState>) => setForm((f) => ({ ...f, ...next }))

  const isSeriesEdit = mode === 'edit' && source !== undefined && source.meeting.recurrence !== 'none'
  const fixedDate = isSeriesEdit && form.scope === 'series'
  const errors = validateForm(form, mode, now, source !== undefined)
  const show = (key: keyof typeof errors) => (submitted ? errors[key] : undefined)
  const showWhen = (key: 'when' | 'duration') => (whenChecked || submitted ? errors[key] : undefined)
  const whenOnScreen = wizard ? step === 1 : whenOpen

  // typing the title is the first thing to do after choosing a time
  useEffect(() => {
    if (wizard && step === 2) document.getElementById('sch-title')?.focus()
  }, [wizard, step])

  const focusSoon = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus())

  const submit = () => {
    if (wizard && step === 1) {
      setWhenChecked(true)
      if (errors.when || errors.duration) return focusSoon(FIELD_IDS[errors.when ? 'when' : 'duration'])
      setStep(2)
      return
    }
    setSubmitted(true)
    const firstBad = FIELD_ORDER.find((k) => errors[k])
    if (!firstBad) return onSave(buildResult(mode, form, source, undefined, user.name))
    if (firstBad === 'when' || firstBad === 'duration') {
      setWhenChecked(true)
      if (wizard) setStep(1)
      else setWhenOpen(true)
    }
    focusSoon(FIELD_IDS[firstBad])
  }

  const primaryLabel = wizard && step === 1 ? 'Lanjut' : mode === 'edit' ? 'Simpan perubahan' : 'Simpan jadwal'

  return (
    <Modal
      title={TITLES[mode]}
      size="full"
      onClose={onClose}
      width={720}
      footer={
        <>
          {wizard && step === 2 ? (
            <button type="button" className={ui.btn} onClick={() => setStep(1)}>
              Kembali
            </button>
          ) : (
            <button type="button" className={ui.btn} onClick={onClose}>
              Batal
            </button>
          )}
          <button type="submit" form={`${uid}-form`} className={`${ui.btn} ${ui.primary}`}>
            {primaryLabel}
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
        {wizard && (
          <ol className={styles.steps} aria-label="Langkah">
            <li aria-current={step === 1 ? 'step' : undefined}>
              {step === 2 ? (
                <button type="button" onClick={() => setStep(1)}>
                  Kapan
                </button>
              ) : (
                'Kapan'
              )}
            </li>
            <li aria-current={step === 2 ? 'step' : undefined}>Detail</li>
          </ol>
        )}

        <div key={step} className={styles.stage}>
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

          {wizard && step === 1 ? (
            <WhenStep
              form={form}
              now={now}
              meetings={meetings}
              excludeId={source?.meeting.id}
              fixedDate={fixedDate}
              recurrenceLocked={false}
              errors={{ when: showWhen('when'), duration: showWhen('duration') }}
              onChange={patch}
            />
          ) : (
            <>
              <WhenCard form={form} expanded={wizard ? undefined : whenOpen} onAction={() => (wizard ? setStep(1) : setWhenOpen((o) => !o))}>
                {whenOnScreen && (
                  <WhenStep
                    form={form}
                    now={now}
                    meetings={meetings}
                    excludeId={source?.meeting.id}
                    fixedDate={fixedDate}
                    recurrenceLocked={isSeriesEdit && form.scope === 'single'}
                    errors={{ when: showWhen('when'), duration: showWhen('duration') }}
                    onChange={patch}
                  />
                )}
              </WhenCard>

              <Field label="Judul" id="sch-title" error={show('title')}>
                <input
                  id="sch-title"
                  className={ui.input}
                  type="text"
                  autoComplete="off"
                  data-autofocus={(!wizard && mode !== 'edit') || undefined}
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
            </>
          )}
        </div>
      </form>
    </Modal>
  )
}

/** The chosen time in one line, with a way back to change it. In edit mode it unfolds the picker in place. */
function WhenCard({ form, expanded, onAction, children }: { form: FormState; expanded?: boolean; onAction: () => void; children?: ReactNode }) {
  const valid = isDayKey(form.date) && /^\d{2}:\d{2}$/.test(form.time)
  const repeat = form.recurrence === 'none' ? '' : ` · ${recurrenceLabel(form.recurrence).toLowerCase()}`
  return (
    <section className={styles.whenCard} aria-label="Waktu rapat">
      <div className={styles.whenSummary}>
        <CalendarDays size={20} strokeWidth={1.75} aria-hidden="true" />
        <div>
          <strong>{valid ? formatDay(form.date) : 'Belum ada waktu'}</strong>
          <span>
            {valid ? `${formatRange(form.date, form.time, form.durationMin, form.timezone)} ${zoneShortName(form.timezone)}${repeat}` : 'Pilih tanggal dan jam'}
          </span>
        </div>
        <button type="button" className={`${ui.btn} ${ui.small}`} aria-expanded={expanded} onClick={onAction}>
          {expanded ? 'Tutup' : 'Ubah'}
        </button>
      </div>
      {children}
    </section>
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
