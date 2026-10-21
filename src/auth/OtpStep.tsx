import { ArrowLeft, Info, Lock, TriangleAlert } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import ui from '../dashboard/ui.module.css'
import { MockInbox } from './MockInbox'
import { OTP_LENGTH, canResend, checkOtp, generateOtpCode, isLocked, resendOtp, secondsUntil } from './otpFlow'
import type { OtpState } from './otpFlow'
import { useTick } from './useTick'
import card from './LoginPage.module.css'
import styles from './OtpStep.module.css'

interface OtpStepProps {
  otp: OtpState
  onOtpChange: (next: OtpState) => void
  onVerified: () => void
  onBack: () => void
}

type Feedback = { kind: 'wrong'; attemptsLeft: number } | { kind: 'resent' } | null

const CELLS = Array.from({ length: OTP_LENGTH }, (_, i) => i)

function clock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

/** Second step of the email sign-in: the six-digit code. One real input sits over six drawn cells, so paste and autofill just work. */
export function OtpStep({ otp, onOtpChange, onVerified, onBack }: OtpStepProps) {
  const now = useTick(true)
  const [entry, setEntry] = useState('')
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [shake, setShake] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const uid = useId()

  const locked = isLocked(otp, now)
  const expired = now >= otp.expiresAt
  const blocked = locked || expired
  const resendIn = secondsUntil(otp.resendAt, now)
  const activeCell = Math.min(entry.length, OTP_LENGTH - 1)

  useEffect(() => {
    input.current?.focus()
  }, [])

  // once the lock or the expiry lifts (a new code), hand the keyboard back
  useEffect(() => {
    if (!blocked) input.current?.focus()
  }, [blocked])

  const verify = (value: string) => {
    const { state, outcome } = checkOtp(otp, value, Date.now())
    onOtpChange(state)
    if (outcome.kind === 'ok') return onVerified()
    if (outcome.kind === 'incomplete') return
    setEntry('')
    setShake((n) => n + 1)
    setFeedback(outcome.kind === 'wrong' ? { kind: 'wrong', attemptsLeft: outcome.attemptsLeft } : null)
    input.current?.focus()
  }

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH)
    setEntry(digits)
    setFeedback(null)
    if (digits.length === OTP_LENGTH) verify(digits)
  }

  const resend = () => {
    onOtpChange(resendOtp(otp, Date.now(), generateOtpCode()))
    setEntry('')
    setFeedback({ kind: 'resent' })
    input.current?.focus()
  }

  let status: ReactNode = null
  if (locked) {
    status = (
      <>
        <Lock size={16} strokeWidth={1.75} aria-hidden="true" />
        Terlalu banyak kode salah. Coba lagi dalam {secondsUntil(otp.lockedUntil, now)} detik.
      </>
    )
  } else if (expired) {
    status = (
      <>
        <TriangleAlert size={16} strokeWidth={1.75} aria-hidden="true" />
        Kode sudah kedaluwarsa. Kirim kode baru untuk melanjutkan.
      </>
    )
  } else if (feedback?.kind === 'wrong') {
    status = (
      <>
        <TriangleAlert size={16} strokeWidth={1.75} aria-hidden="true" />
        Kode salah. Sisa {feedback.attemptsLeft} percobaan.
      </>
    )
  } else if (feedback?.kind === 'resent') {
    status = (
      <>
        <Info size={16} strokeWidth={1.75} aria-hidden="true" />
        Kode baru sudah dikirim. Kode sebelumnya tidak berlaku lagi.
      </>
    )
  }
  const isProblem = locked || expired || feedback?.kind === 'wrong'

  return (
    <>
      <div className={card.card}>
        <button type="button" className={`${ui.btn} ${ui.small} ${styles.back}`} onClick={onBack}>
          <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" />
          Ganti email
        </button>

        <h1 className={card.title}>Cek email Anda</h1>
        <p className={card.lead}>
          Kami mengirim kode {OTP_LENGTH} digit ke <strong className={styles.email}>{otp.email}</strong>.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            verify(entry)
          }}
        >
          <label className={ui.label} htmlFor={`${uid}-code`}>
            Kode {OTP_LENGTH} digit
          </label>
          <div className={styles.field}>
            <div key={shake} className={styles.cells} data-shake={shake > 0 || undefined} data-problem={isProblem || undefined} aria-hidden="true">
              {CELLS.map((i) => (
                <span key={i} className={styles.cell} data-filled={i < entry.length || undefined} data-active={(!blocked && i === activeCell) || undefined}>
                  {entry[i] ?? ''}
                </span>
              ))}
            </div>
            <input
              ref={input}
              id={`${uid}-code`}
              className={styles.input}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={OTP_LENGTH}
              value={entry}
              disabled={blocked}
              aria-describedby={`${uid}-status`}
              aria-invalid={isProblem || undefined}
              onChange={onInput}
            />
          </div>

          <p id={`${uid}-status`} className={styles.status} data-problem={isProblem || undefined} aria-live="polite">
            {status}
          </p>

          <button type="submit" className={`${ui.btn} ${ui.primary} ${ui.large} ${card.block}`} disabled={blocked || entry.length < OTP_LENGTH}>
            Masuk
          </button>
        </form>

        <div className={styles.foot}>
          <p className={styles.validity}>{blocked ? ' ' : <>Kode berlaku <span className={ui.mono}>{clock(secondsUntil(otp.expiresAt, now))}</span></>}</p>
          <button type="button" className={`${ui.btn} ${ui.small}`} disabled={!canResend(otp, now)} onClick={resend}>
            {canResend(otp, now) || resendIn === 0 ? 'Kirim ulang kode' : `Kirim ulang dalam ${resendIn} dtk`}
          </button>
        </div>
      </div>

      <MockInbox otp={otp} onOtpChange={onOtpChange} />
    </>
  )
}
