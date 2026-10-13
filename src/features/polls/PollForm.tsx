import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import type { Poll } from '../../state/types'
import { AUTO_CLOSE_CHOICES, MAX_OPTION, MAX_OPTIONS, MAX_QUESTION, MIN_OPTIONS, SAMPLE_POLL } from './pollMath'
import styles from './PollForm.module.css'

type PollDraft = Omit<Poll, 'id' | 'status' | 'votes' | 'startedAt' | 'creatorId' | 'options'> & { options: readonly string[] }

interface PollFormProps {
  /** Pre-fill, used by "Mulai ulang" */
  initial?: { question: string; options: readonly string[] }
  onStart: (draft: PollDraft) => void
  onCancel: () => void
}

export type { PollDraft }

/** Host/co-host form (Design.md 13.3). Anonymous and live results default to on. */
export function PollForm({ initial, onStart, onCancel }: PollFormProps) {
  const [question, setQuestion] = useState(initial?.question ?? '')
  const [options, setOptions] = useState<readonly string[]>(initial?.options.length ? initial.options : ['', ''])
  const [multiple, setMultiple] = useState(false)
  const [anonymous, setAnonymous] = useState(true)
  const [liveResults, setLiveResults] = useState(true)
  const [autoClose, setAutoClose] = useState('manual')

  const filled = options.map((o) => o.trim()).filter(Boolean)
  const canStart = question.trim().length > 0 && filled.length >= MIN_OPTIONS

  const setOption = (i: number, value: string) => setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)))
  const removeOption = (i: number) => setOptions((prev) => prev.filter((_, idx) => idx !== i))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canStart) return
    const choice = AUTO_CLOSE_CHOICES.find((c) => String(c.seconds ?? 'manual') === autoClose)
    onStart({ question: question.trim(), options: filled, multiple, anonymous, liveResults, autoCloseS: choice?.seconds ?? null })
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.titleRow}>
        <h3>Buat polling</h3>
        <button
          type="button"
          className={styles.link}
          onClick={() => {
            setQuestion(SAMPLE_POLL.question)
            setOptions(SAMPLE_POLL.options)
          }}
        >
          Pakai contoh
        </button>
      </div>

      <label className={styles.field}>
        <span>Pertanyaan</span>
        <textarea value={question} maxLength={MAX_QUESTION} rows={2} placeholder="Apa yang ingin Anda tanyakan?" onChange={(e) => setQuestion(e.target.value)} />
        <small>{question.length}/{MAX_QUESTION}</small>
      </label>

      <fieldset className={styles.options}>
        <legend>Opsi (minimal {MIN_OPTIONS}, maksimal {MAX_OPTIONS})</legend>
        {options.map((o, i) => (
          <div key={i} className={styles.optionRow}>
            <input value={o} maxLength={MAX_OPTION} placeholder={`Opsi ${i + 1}`} aria-label={`Opsi ${i + 1}`} onChange={(e) => setOption(i, e.target.value)} />
            {options.length > MIN_OPTIONS && (
              <button type="button" className={styles.remove} aria-label={`Hapus opsi ${i + 1}`} onClick={() => removeOption(i)}>
                <X size={16} strokeWidth={1.75} aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
        {options.length < MAX_OPTIONS && (
          <button type="button" className={styles.add} onClick={() => setOptions((prev) => [...prev, ''])}>
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
            Tambah opsi
          </button>
        )}
      </fieldset>

      <div className={styles.switches}>
        <Switch label="Pilihan ganda" on={multiple} onChange={setMultiple} />
        <Switch label="Anonim" on={anonymous} onChange={setAnonymous} />
        <Switch label="Tampilkan hasil langsung" on={liveResults} onChange={setLiveResults} />
      </div>

      <label className={styles.inline}>
        <span>Tutup otomatis</span>
        <select value={autoClose} onChange={(e) => setAutoClose(e.target.value)}>
          {AUTO_CLOSE_CHOICES.map((c) => (
            <option key={c.label} value={c.seconds ?? 'manual'}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={onCancel}>
          Batal
        </button>
        <button type="submit" className={styles.primary} disabled={!canStart}>
          Mulai polling
        </button>
      </div>
    </form>
  )
}

function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} className={styles.switch} onClick={() => onChange(!on)}>
      <span>{label}</span>
      <i aria-hidden="true" />
    </button>
  )
}
