import { Check, Copy, Mail, MessageCircle, Share2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { copyText } from './clipboard'
import { mailtoUrl, whatsappUrl } from './inviteLink'
import styles from './InvitePopover.module.css'

interface InvitePopoverProps {
  title: string
  url: string
  /** A locked meeting admits newcomers only after the host approves */
  locked: boolean
}

const COPIED_MS = 2200
const ICON = { size: 16, strokeWidth: 1.75, 'aria-hidden': true } as const

/** Copy / share the meeting link. Opens above the info pill; the parent owns open state and dismissal. */
export function InvitePopover({ title, url, locked }: InvitePopoverProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const canShare = typeof navigator.share === 'function'

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    if (status !== 'copied') return
    const id = window.setTimeout(() => setStatus('idle'), COPIED_MS)
    return () => window.clearTimeout(id)
  }, [status])

  const copy = async () => setStatus((await copyText(url)) ? 'copied' : 'failed')

  const share = async () => {
    try {
      await navigator.share({ title, text: `Gabung meeting "${title}"`, url })
    } catch (error: unknown) {
      // Closing the share sheet rejects with AbortError; anything else falls back to copying
      if (!(error instanceof DOMException && error.name === 'AbortError')) await copy()
    }
  }

  return (
    <motion.div
      className={`glass-2 ${styles.popover}`}
      role="dialog"
      aria-label="Undang lewat tautan"
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.12 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
    >
      <h2>Undang lewat tautan</h2>
      <p className={styles.sub}>{title}</p>

      <div className={styles.field}>
        <input ref={inputRef} type="text" readOnly value={url} aria-label="Tautan meeting" onFocus={(e) => e.currentTarget.select()} />
      </div>
      <p className={styles.live} role="status" data-failed={status === 'failed' || undefined}>
        {status === 'copied' && 'Tautan disalin ke clipboard.'}
        {status === 'failed' && 'Tidak bisa menyalin otomatis. Pilih tautan di atas lalu salin manual.'}
      </p>

      <div className={styles.actions}>
        <button type="button" className={styles.copy} data-state={status} onClick={copy}>
          {status === 'copied' ? <Check {...ICON} /> : <Copy {...ICON} />}
          {status === 'copied' ? 'Tersalin' : 'Salin tautan'}
        </button>
        {canShare && (
          <button type="button" onClick={share}>
            <Share2 {...ICON} />
            Bagikan
          </button>
        )}
        <a href={whatsappUrl(title, url)} target="_blank" rel="noopener noreferrer">
          <MessageCircle {...ICON} />
          WhatsApp
        </a>
        <a href={mailtoUrl(title, url)}>
          <Mail {...ICON} />
          Email
        </a>
      </div>

      {locked && <p className={styles.hint}>Meeting sedang dikunci. Orang yang membuka tautan menunggu persetujuan host.</p>}
    </motion.div>
  )
}
