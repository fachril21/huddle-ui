import { ShieldAlert } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Role } from '../../state/types'
import styles from './ClaimHostBanner.module.css'

interface ClaimHostBannerProps {
  /** True while nobody holds the host role */
  visible: boolean
  selfRole: Role
  hostKey: string
  /** Sit below the host announcement banner instead of on top of it */
  stacked: boolean
  onClaim: (key: string) => void
}

const KEY_LENGTH = 6

/** "Belum ada host" strip with a Zoom-style claim flow: Co-hosts claim directly, everyone else enters the host key. */
export function ClaimHostBanner({ visible, selfRole, hostKey, stacked, onClaim }: ClaimHostBannerProps) {
  const [asking, setAsking] = useState(false)
  const [key, setKey] = useState('')
  const [wrong, setWrong] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const needsKey = selfRole !== 'Co-host'

  useEffect(() => {
    if (!visible) {
      setAsking(false)
      setKey('')
      setWrong(false)
    }
  }, [visible])

  useEffect(() => {
    if (asking) inputRef.current?.focus()
  }, [asking])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (key !== hostKey) {
      setWrong(true)
      inputRef.current?.select()
      return
    }
    onClaim(key)
  }

  return (
    <div className={styles.slot} data-stacked={stacked}>
      <AnimatePresence>
        {visible && (
          <motion.div
            className={`glass-2 ${styles.banner}`}
            role="status"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <ShieldAlert size={20} strokeWidth={1.75} aria-hidden="true" className={styles.icon} />
            <div className={styles.copy}>
              <b>Belum ada host di meeting ini</b>
              <span>Tanpa host, tamu menunggu, rekaman, dan alat host tidak bisa dikelola.</span>
            </div>
            {asking && needsKey ? (
              <form className={styles.form} onSubmit={submit} noValidate>
                <input
                  ref={inputRef}
                  value={key}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={KEY_LENGTH}
                  placeholder="Kunci host"
                  aria-label={`Kunci host, ${KEY_LENGTH} digit`}
                  aria-invalid={wrong}
                  aria-describedby="claim-host-error"
                  onChange={(e) => {
                    setKey(e.target.value.replace(/\D/g, ''))
                    setWrong(false)
                  }}
                />
                <button type="submit" className={styles.primary} disabled={key.length !== KEY_LENGTH}>
                  Klaim
                </button>
                <button type="button" className={styles.ghost} onClick={() => setAsking(false)}>
                  Batal
                </button>
                <span id="claim-host-error" className={styles.error} role="alert">
                  {wrong ? 'Kunci host salah. Periksa lagi.' : ''}
                </span>
              </form>
            ) : (
              <button type="button" className={styles.primary} onClick={() => (needsKey ? setAsking(true) : onClaim(''))}>
                Klaim host
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
