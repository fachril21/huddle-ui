import { CalendarPlus, ChevronDown, Copy, Link2, LogIn, Video, Zap } from 'lucide-react'
import { useState } from 'react'
import type { RefObject } from 'react'
import { INVITE_ORIGIN } from '../features/invite/inviteLink'
import { MY_ROOM_CODE, MY_ROOM_TITLE } from './constants'
import { DASHBOARD_KEYS } from './dashboardShortcuts'
import { Menu } from './Menu'
import type { MenuItem } from './Menu'
import ui from './ui.module.css'
import styles from './CommandBar.module.css'

interface CommandBarProps {
  codeRef: RefObject<HTMLInputElement | null>
  /** Why the last attempt to join failed, if it did */
  joinError: string | null
  onClearError: () => void
  onJoinCode: (raw: string) => void
  onInstant: () => void
  onLater: () => void
  onSchedule: () => void
  onStartMyRoom: () => void
  onCopyMyRoom: () => void
}

const ICON = { size: 18, strokeWidth: 1.75, 'aria-hidden': true } as const
const MY_ROOM_LINK = `${INVITE_ORIGIN.replace('https://', '')}/${MY_ROOM_CODE}`

/** The top of the page: make a meeting, schedule one, or join with a code, then your own room. */
export function CommandBar({ codeRef, joinError, onClearError, onJoinCode, onInstant, onLater, onSchedule, onStartMyRoom, onCopyMyRoom }: CommandBarProps) {
  const [code, setCode] = useState('')

  const items: MenuItem[] = [
    { id: 'instant', label: 'Rapat dadakan', description: 'Mulai sekarang dan langsung masuk', icon: <Zap {...ICON} />, keyHint: DASHBOARD_KEYS.instant, onSelect: onInstant },
    { id: 'later', label: 'Buat untuk nanti', description: 'Dapat tautan, bagikan, mulai kapan saja', icon: <Link2 {...ICON} />, onSelect: onLater },
    { id: 'schedule', label: 'Jadwalkan rapat', description: 'Atur tanggal, jam, dan undangan', icon: <CalendarPlus {...ICON} />, keyHint: DASHBOARD_KEYS.schedule, onSelect: onSchedule },
  ]

  return (
    <section className={`glass-3 ${styles.bar}`} aria-label="Buat atau masuk rapat">
      <div className={styles.row}>
        <div className={styles.make}>
          <Menu
            items={items}
            width={320}
            trigger={(props, open) => (
              <button type="button" className={`${ui.btn} ${ui.primary} ${ui.large}`} {...props} data-open={open || undefined}>
                <Video className={styles.leadIcon} size={20} strokeWidth={1.75} aria-hidden="true" />
                Buat rapat
                <ChevronDown className={styles.chevron} size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          />
          <button type="button" className={`${ui.btn} ${ui.large} ${styles.schedule}`} onClick={onSchedule} aria-keyshortcuts={DASHBOARD_KEYS.schedule}>
            <CalendarPlus size={18} strokeWidth={1.75} aria-hidden="true" />
            Jadwalkan
            <kbd className="keycap" aria-hidden="true">
              {DASHBOARD_KEYS.schedule}
            </kbd>
          </button>
        </div>

        <form
          className={styles.join}
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            onJoinCode(code)
          }}
        >
          <label htmlFor="join-code" className="sr-only">
            Kode atau tautan rapat
          </label>
          <div className={styles.field}>
            <input
              ref={codeRef}
              id="join-code"
              className={`${ui.input} ${styles.input}`}
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="Kode atau tautan"
              value={code}
              aria-invalid={joinError ? true : undefined}
              aria-describedby={joinError ? 'join-error' : undefined}
              onChange={(e) => {
                setCode(e.target.value)
                if (joinError) onClearError()
              }}
            />
            <kbd className={`keycap ${styles.hint}`} aria-hidden="true">
              {DASHBOARD_KEYS.code}
            </kbd>
            <p id="join-error" className={styles.error} role="alert">
              {joinError}
            </p>
          </div>
          <button type="submit" className={`${ui.btn} ${ui.large}`} aria-disabled={code.trim() === '' || undefined} aria-keyshortcuts="Enter">
            <LogIn size={18} strokeWidth={1.75} aria-hidden="true" />
            Masuk
          </button>
        </form>
      </div>

      <div className={styles.room}>
        <div className={styles.roomText}>
          <h2>{MY_ROOM_TITLE}</h2>
          <span className={`${ui.mono} ${styles.link}`}>{MY_ROOM_LINK}</span>
        </div>
        <button type="button" className={`${ui.btn} ${ui.small}`} onClick={onCopyMyRoom}>
          <Copy size={14} strokeWidth={1.75} aria-hidden="true" />
          Salin tautan
        </button>
        <button type="button" className={`${ui.btn} ${ui.small}`} onClick={onStartMyRoom}>
          <Video size={14} strokeWidth={1.75} aria-hidden="true" />
          Mulai
        </button>
      </div>
    </section>
  )
}
