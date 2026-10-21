import { useEffect, useRef, useState } from 'react'
import { Ambient } from '../room/Ambient'
import { useFx } from '../room/MotionContext'
import { ssoRejection } from './copy'
import { validateEmail } from './domains'
import { EmailStep } from './EmailStep'
import { OtpStep } from './OtpStep'
import { generateOtpCode, issueOtp } from './otpFlow'
import type { OtpState } from './otpFlow'
import { createSession } from './session'
import type { Session } from './session'
import { SsoChooser } from './SsoChooser'
import type { GoogleAccount } from './ssoAccounts'
import styles from './LoginPage.module.css'

/** How long the fake round trips (Google, the mail server) take, so the waiting states can be seen */
const LATENCY_MS = 800

type Step = { kind: 'start' } | { kind: 'otp'; otp: OtpState }

interface LoginPageProps {
  onSignedIn: (session: Session) => void
}

/**
 * Sign in for the dashboard: Google, or an email code. Only the two company domains get through.
 * Everything here is simulated; the real checks (domain on the verified identity, code issue and
 * verification, rate limits) belong to the server.
 */
export function LoginPage({ onSignedIn }: LoginPageProps) {
  const { fx, reduced } = useFx()
  const [step, setStep] = useState<Step>({ kind: 'start' })
  const [busy, setBusy] = useState<'google' | 'email' | null>(null)
  const [chooserOpen, setChooserOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const afterLatency = (work: () => void) => {
    timer.current = window.setTimeout(work, LATENCY_MS)
  }

  const pickGoogleAccount = (account: GoogleAccount) => {
    setChooserOpen(false)
    setNotice(null)
    setBusy('google')
    afterLatency(() => {
      setBusy(null)
      const check = validateEmail(account.email)
      if (!check.ok) return setNotice(ssoRejection(account.email))
      onSignedIn(createSession(check.email, 'google', Date.now()))
    })
  }

  const sendCode = (email: string) => {
    setNotice(null)
    setBusy('email')
    afterLatency(() => {
      setBusy(null)
      setStep({ kind: 'otp', otp: issueOtp(email, Date.now(), generateOtpCode()) })
    })
  }

  return (
    <div className={styles.screen} data-fx={fx} data-motion={reduced ? 'reduced' : undefined}>
      <Ambient />
      <main className={styles.stage}>
        <div className={styles.column}>
          <p className={styles.brand}>
            <i className={styles.mark} aria-hidden="true" />
            Huddle
          </p>

          {step.kind === 'start' ? (
            <EmailStep busy={busy} notice={notice} onGoogle={() => setChooserOpen(true)} onSendCode={sendCode} />
          ) : (
            <OtpStep
              otp={step.otp}
              onOtpChange={(otp) => setStep({ kind: 'otp', otp })}
              onVerified={() => onSignedIn(createSession(step.otp.email, 'email', Date.now()))}
              onBack={() => setStep({ kind: 'start' })}
            />
          )}

          <p className={styles.guest}>Punya tautan rapat? Buka saja tautannya, tamu tidak perlu masuk.</p>
        </div>
      </main>

      {chooserOpen && <SsoChooser onPick={pickGoogleAccount} onClose={() => setChooserOpen(false)} />}
    </div>
  )
}
