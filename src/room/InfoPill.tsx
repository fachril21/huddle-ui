import { UserPlus } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { InvitePopover } from '../features/invite/InvitePopover'
import { buildInviteUrl } from '../features/invite/inviteLink'
import { MEETING_CODE, MEETING_TITLE } from './meeting'
import { shortcutKey } from './shortcuts'
import styles from './InfoPill.module.css'

/** The mock meeting is already a few minutes in. */
const START_OFFSET_S = 12 * 60 + 34
const INVITE_URL = buildInviteUrl(MEETING_CODE)

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

interface InfoPillProps {
  inviteOpen: boolean
  locked: boolean
  onInviteToggle: () => void
  onInviteClose: () => void
  /** Phone: the invite link opens in a sheet owned by the room, not in a popover here */
  phone?: boolean
}

/** Bottom-left glass-1 pill: title, meeting code (mono), elapsed timer, and the invite-link button. */
export function InfoPill({ inviteOpen, locked, onInviteToggle, onInviteClose, phone = false }: InfoPillProps) {
  const [elapsed, setElapsed] = useState(START_OFFSET_S)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  // Esc or a click outside closes the popover; Esc returns focus to the trigger
  useEffect(() => {
    if (!inviteOpen || phone) return
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) onInviteClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      onInviteClose()
      wrapRef.current?.querySelector<HTMLElement>('[data-invite-trigger]')?.focus()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [inviteOpen, onInviteClose, phone])

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <div className={`glass-1 ${styles.pill}`}>
        <div className={styles.info}>
          <span className={styles.title}>{MEETING_TITLE}</span>
          <span className={styles.meta}>
            <span>{MEETING_CODE}</span>
            <span className={styles.dot} aria-hidden="true" />
            <time>{formatElapsed(elapsed)}</time>
          </span>
        </div>
        <button
          type="button"
          data-invite-trigger
          className={styles.invite}
          aria-label="Undang lewat tautan"
          aria-expanded={inviteOpen}
          aria-keyshortcuts={shortcutKey('invite')}
          onClick={onInviteToggle}
        >
          <UserPlus size={18} strokeWidth={1.75} aria-hidden="true" />
          <span role="tooltip" className={`glass-1 ${styles.tip}`}>
            Undang lewat tautan
            <kbd className="keycap">{shortcutKey('invite')}</kbd>
          </span>
        </button>
      </div>
      <AnimatePresence>{inviteOpen && !phone && <InvitePopover key="invite" title={MEETING_TITLE} url={INVITE_URL} locked={locked} />}</AnimatePresence>
    </div>
  )
}
