import { TriangleAlert } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import ui from '../dashboard/ui.module.css'
import { DOMAIN_HINT, emailError } from './copy'
import { ALLOWED_DOMAINS, completeEmail, validateEmail } from './domains'
import { GoogleMark } from './GoogleMark'
import card from './LoginPage.module.css'
import styles from './EmailStep.module.css'

interface EmailStepProps {
  busy: 'google' | 'email' | null
  /** Why the last Google attempt was turned away, if it was */
  notice: string | null
  onGoogle: () => void
  onSendCode: (email: string) => void
}

/** First step: Google, or an email address that will be sent a code. No password anywhere. */
export function EmailStep({ busy, notice, onGoogle, onSendCode }: EmailStepProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const field = useRef<HTMLInputElement>(null)
  const uid = useId()
  const describedBy = error ? `${uid}-error` : `${uid}-hint`

  const submit = () => {
    const check = validateEmail(value)
    if (!check.ok) {
      setError(emailError(check))
      field.current?.focus()
      return
    }
    setError(null)
    onSendCode(check.email)
  }

  const pickDomain = (domain: string) => {
    const next = completeEmail(value, domain)
    if (next === null) {
      field.current?.focus()
      return
    }
    setValue(next)
    setError(null)
    field.current?.focus()
  }

  return (
    <div className={card.card}>
      <h1 className={card.title}>Masuk ke Huddle</h1>
      <p className={card.lead}>{DOMAIN_HINT}</p>

      {notice && (
        <p className={styles.notice} role="alert">
          <TriangleAlert size={16} strokeWidth={1.75} aria-hidden="true" />
          {notice}
        </p>
      )}

      <button type="button" className={`${ui.btn} ${ui.large} ${card.block}`} disabled={busy !== null} onClick={onGoogle}>
        <GoogleMark />
        {busy === 'google' ? 'Menghubungkan ke Google…' : 'Masuk dengan Google'}
      </button>

      <div className={styles.divider} role="separator">
        <span>atau pakai email</span>
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <label className={ui.label} htmlFor={`${uid}-email`}>
          Email
        </label>
        <input
          ref={field}
          id={`${uid}-email`}
          className={ui.input}
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="nama@dibimbing.id"
          value={value}
          disabled={busy !== null}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => {
            setValue(e.target.value)
            if (error) setError(null)
          }}
        />

        <div className={styles.chips} role="group" aria-label="Pilih domain">
          {ALLOWED_DOMAINS.map((domain) => (
            <button key={domain} type="button" className={styles.chip} disabled={busy !== null} aria-label={`Pakai domain ${domain}`} onClick={() => pickDomain(domain)}>
              @{domain}
            </button>
          ))}
        </div>

        {error ? (
          <p id={`${uid}-error`} className={ui.error} role="alert">
            {error}
          </p>
        ) : (
          <p id={`${uid}-hint`} className={ui.hint}>
            Kami kirim kode 6 digit ke email ini. Tanpa kata sandi.
          </p>
        )}

        <button type="submit" className={`${ui.btn} ${ui.primary} ${ui.large} ${card.block} ${styles.send}`} disabled={busy !== null}>
          {busy === 'email' ? 'Mengirim kode…' : 'Kirim kode'}
        </button>
      </form>
    </div>
  )
}
