import { Check } from 'lucide-react'
import { useEffect } from 'react'
import styles from './Toast.module.css'

const TOAST_MS = 2600

interface ToastProps {
  message: string | null
  onDone: () => void
}

/** A short confirmation that clears itself. The live region stays mounted so screen readers hear each message. */
export function Toast({ message, onDone }: ToastProps) {
  useEffect(() => {
    if (!message) return
    const id = window.setTimeout(onDone, TOAST_MS)
    return () => window.clearTimeout(id)
  }, [message, onDone])

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {message && (
        <p key={message} className={`glass-2 ${styles.toast}`}>
          <Check size={16} strokeWidth={2} aria-hidden="true" />
          {message}
        </p>
      )}
    </div>
  )
}
