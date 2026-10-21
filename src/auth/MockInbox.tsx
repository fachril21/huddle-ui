import { useState } from 'react'
import { copyText } from '../features/invite/clipboard'
import { expireNow } from './otpFlow'
import type { OtpState } from './otpFlow'
import styles from './MockInbox.module.css'

interface MockInboxProps {
  otp: OtpState
  onOtpChange: (next: OtpState) => void
}

/**
 * Prototype only. No mail is sent, so this panel shows the code that would arrive. Deliberately not styled
 * like product UI (dashed outline, mono type), the same way the Demo Director is not.
 */
export function MockInbox({ otp, onOtpChange }: MockInboxProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    const ok = await copyText(otp.code)
    setCopied(ok)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <aside className={styles.inbox} aria-label="Kotak surat demo">
      <p className={styles.head}>DEMO · SURAT MASUK</p>
      <p className={styles.line}>
        Dari <span>no-reply@huddle</span> ke <span>{otp.email}</span>
      </p>
      <p className={styles.code}>
        Kode masuk Huddle: <strong>{otp.code}</strong>
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.btn} onClick={copy}>
          {copied ? 'Tersalin' : 'Salin kode'}
        </button>
        <button type="button" className={styles.btn} onClick={() => onOtpChange(expireNow(otp, Date.now()))}>
          Kedaluwarsakan
        </button>
      </div>
    </aside>
  )
}
