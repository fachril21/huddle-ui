import { X } from 'lucide-react'
import { useState } from 'react'
import type { ClipboardEvent, KeyboardEvent } from 'react'
import { MAX_INVITEES } from './constants'
import { parseInvitees } from './schedule'
import ui from './ui.module.css'
import styles from './InviteeInput.module.css'

interface InviteeInputProps {
  id: string
  value: readonly string[]
  onChange: (next: string[]) => void
  error?: string
}

/** Email chips. Enter, comma, space or a paste commits what was typed; bad addresses are named, not silently dropped. */
export function InviteeInput({ id, value, onChange, error }: InviteeInputProps) {
  const [text, setText] = useState('')
  const [rejected, setRejected] = useState<string[]>([])

  const commit = (raw: string) => {
    const { valid, invalid } = parseInvitees(raw)
    const known = new Set(value.map((v) => v.toLowerCase()))
    const fresh = valid.filter((v) => !known.has(v.toLowerCase()))
    if (fresh.length > 0) onChange([...value, ...fresh])
    setRejected(invalid)
    // rejected words are named in the message, not left in the field where the next word would glue onto them
    setText('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', ' ', ';'].includes(e.key) && text.trim()) {
      e.preventDefault()
      commit(text)
    } else if (e.key === 'Backspace' && text === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text')
    if (!/[\s,;]/.test(pasted.trim())) return
    e.preventDefault()
    commit(`${text} ${pasted}`)
  }

  const problem = error ?? (rejected.length > 0 ? `Bukan alamat email yang valid: ${rejected.join(', ')}` : undefined)
  const describedBy = `${id}-note`

  return (
    <div>
      <div className={styles.box} data-invalid={problem ? true : undefined}>
        {value.map((email) => (
          <span key={email} className={styles.chip}>
            {email}
            <button type="button" onClick={() => onChange(value.filter((v) => v !== email))} aria-label={`Hapus ${email}`}>
              <X size={12} strokeWidth={2} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          inputMode="email"
          autoComplete="off"
          spellCheck={false}
          value={text}
          placeholder={value.length === 0 ? 'nama@email.com, pisahkan dengan koma' : 'Tambah email'}
          aria-invalid={problem ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={() => text.trim() && commit(text)}
        />
      </div>
      <p id={describedBy} className={problem ? ui.error : ui.hint} role={problem ? 'alert' : undefined}>
        {problem ?? `${value.length} dari ${MAX_INVITEES} undangan. Opsional.`}
      </p>
    </div>
  )
}
