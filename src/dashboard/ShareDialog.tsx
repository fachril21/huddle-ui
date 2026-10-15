import { Check, Copy, Link2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { copyText } from '../features/invite/clipboard'
import { Modal } from './Modal'
import ui from './ui.module.css'
import styles from './ShareDialog.module.css'

interface ShareDialogProps {
  title: string
  heading: string
  /** One line under the heading, e.g. when the meeting is */
  summary: string
  link: string
  /** Full invitation text. Without it the dialog only offers the link. */
  invitation?: string
  /** Optional way straight into the room, for a link made "for later" */
  primary?: { label: string; onClick: () => void }
  onClose: () => void
}

type CopyState = 'idle' | 'invitation' | 'link' | 'failed'
const COPIED_MS = 2200

/** The result of making or scheduling a meeting: the text to paste into a chat or email. */
export function ShareDialog({ title, heading, summary, link, invitation, primary, onClose }: ShareDialogProps) {
  const [state, setState] = useState<CopyState>('idle')

  useEffect(() => {
    if (state === 'idle' || state === 'failed') return
    const id = window.setTimeout(() => setState('idle'), COPIED_MS)
    return () => window.clearTimeout(id)
  }, [state])

  const copy = async (text: string, kind: 'invitation' | 'link') => setState((await copyText(text)) ? kind : 'failed')

  return (
    <Modal
      title={heading}
      onClose={onClose}
      width={560}
      footer={
        <>
          <button type="button" className={ui.btn} onClick={onClose}>
            Selesai
          </button>
          {primary && (
            <button type="button" className={`${ui.btn} ${ui.primary}`} onClick={primary.onClick}>
              {primary.label}
            </button>
          )}
        </>
      }
    >
      <div className={styles.body}>
        <p className={styles.summary}>
          <strong>{title}</strong>
          {summary}
        </p>

        {invitation && (
          <div>
            <label className={ui.label} htmlFor="share-text">
              Undangan
            </label>
            <textarea id="share-text" className={`${ui.input} ${styles.text}`} readOnly rows={invitation.split('\n').length} value={invitation} onFocus={(e) => e.currentTarget.select()} />
          </div>
        )}

        <div>
          <label className={ui.label} htmlFor="share-link">
            Tautan
          </label>
          <input id="share-link" className={`${ui.input} ${ui.mono}`} readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
        </div>

        <div className={styles.actions}>
          {invitation && (
            <button type="button" className={`${ui.btn} ${ui.primary}`} onClick={() => copy(invitation, 'invitation')}>
              {state === 'invitation' ? <Check size={16} strokeWidth={1.75} aria-hidden="true" /> : <Copy size={16} strokeWidth={1.75} aria-hidden="true" />}
              {state === 'invitation' ? 'Undangan tersalin' : 'Salin undangan'}
            </button>
          )}
          <button type="button" className={`${ui.btn} ${invitation ? '' : ui.primary}`} onClick={() => copy(link, 'link')}>
            {state === 'link' ? <Check size={16} strokeWidth={1.75} aria-hidden="true" /> : <Link2 size={16} strokeWidth={1.75} aria-hidden="true" />}
            {state === 'link' ? 'Tautan tersalin' : 'Salin tautan'}
          </button>
        </div>
        <p className={styles.live} role="status" data-failed={state === 'failed' || undefined}>
          {state === 'failed' && 'Tidak bisa menyalin otomatis. Pilih teks di atas lalu salin manual.'}
        </p>
      </div>
    </Modal>
  )
}
