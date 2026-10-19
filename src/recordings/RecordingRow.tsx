import { Download, Ellipsis, Link2, LoaderCircle, Radio, Trash2 } from 'lucide-react'
import { Menu } from '../dashboard/Menu'
import type { MenuItem } from '../dashboard/Menu'
import { PeopleStack } from '../dashboard/PeopleStack'
import { formatClock, formatLongDay } from '../dashboard/schedule'
import ui from '../dashboard/ui.module.css'
import { useViewport } from '../mobile/useViewport'
import { Countdown } from './Countdown'
import { isOwner, ownerLabel, whenLabel } from './labels'
import type { RecordingActions } from './recordingActions'
import { RecordingThumb } from './RecordingThumb'
import { formatDuration, formatSize, phaseOf, remainingMs, stopReasonShort } from './retention'
import type { Recording } from './types'
import styles from './RecordingRow.module.css'

interface RecordingRowProps {
  recording: Recording
  now: Date
  selected: boolean
  actions: RecordingActions
}

const ICON = { size: 16, strokeWidth: 1.75, 'aria-hidden': true } as const

function menuItems(r: Recording, actions: RecordingActions): MenuItem[] {
  return [
    { id: 'link', label: 'Salin tautan', icon: <Link2 {...ICON} />, onSelect: () => actions.copyLink(r) },
    ...(isOwner(r) ? [{ id: 'delete', label: 'Hapus sekarang', icon: <Trash2 {...ICON} />, tone: 'danger' as const, onSelect: () => actions.open(r, 'delete') }] : []),
  ]
}

/** The line under a title: when, how long, how big, and why it stopped. */
function Meta({ recording, now }: { recording: Recording; now: Date }) {
  const phase = phaseOf(recording, now)
  if (phase === 'live') {
    return (
      <>
        <span>{ownerLabel(recording)}</span>
        <span>Dimulai {formatClock(new Date(recording.startedAt))}</span>
      </>
    )
  }
  if (phase === 'expired') {
    return (
      <>
        <span>{formatLongDay(new Date(recording.startedAt))}</span>
        <span>{formatDuration(recording.durationSec)}</span>
      </>
    )
  }
  return (
    <>
      <span>{whenLabel(recording, now)}</span>
      <span>{formatSize(recording.sizeMb)}</span>
      {recording.stopReason && (
        <span className={styles.reason} data-reason={recording.stopReason}>
          {stopReasonShort(recording.stopReason)}
        </span>
      )}
    </>
  )
}

/** One recording: live, being prepared, ready with its countdown, or an expired trace. */
export function RecordingRow({ recording, now, selected, actions }: RecordingRowProps) {
  const phone = useViewport().sizeClass === 'phone'
  const phase = phaseOf(recording, now)
  const remaining = remainingMs(recording, now)
  const expired = phase === 'expired'
  const live = phase === 'live'
  const preparing = phase === 'processing'

  const status = live ? (
    <div className={styles.liveNote}>
      <Radio size={14} strokeWidth={1.75} aria-hidden="true" />
      <span>Merekam</span>
      <span className={ui.mono}>{formatDuration(recording.durationSec)}</span>
    </div>
  ) : preparing ? (
    <div className={styles.prep} role="status">
      <LoaderCircle size={14} strokeWidth={1.75} aria-hidden="true" />
      Menyiapkan file
    </div>
  ) : expired ? (
    <div className={styles.gone}>
      <span>Kedaluwarsa</span>
      <span>File sudah dihapus</span>
    </div>
  ) : remaining !== null ? (
    <Countdown remaining={remaining} />
  ) : null

  const main = (
    <>
      <RecordingThumb recording={recording} phase={phase} />
      <span className={styles.text}>
        <span className={styles.title}>{recording.title}</span>
        <span className={styles.meta}>
          <Meta recording={recording} now={now} />
        </span>
      </span>
    </>
  )

  if (phone) {
    return (
      <li className={styles.row} data-phase={phase} data-selected={selected || undefined} data-phone>
        <button type="button" className={styles.phoneButton} onClick={() => actions.open(recording)} aria-label={`${recording.title}. Buka detail`}>
          {main}
          <span className={styles.phoneStatus}>{status}</span>
        </button>
      </li>
    )
  }

  return (
    <li className={styles.row} data-phase={phase} data-selected={selected || undefined}>
      <button type="button" className={styles.main} onClick={() => actions.open(recording)} aria-pressed={selected} aria-label={`${recording.title}. Buka detail`}>
        {main}
      </button>
      <div className={styles.people}>
        <PeopleStack hostName={recording.hostName} invitees={recording.participants.filter((p) => p !== recording.hostName).map((p) => `${p.toLowerCase()}@huddle.id`)} />
      </div>
      <div className={styles.status}>{status}</div>
      <div className={styles.actions}>
        {live && (
          <button type="button" className={`${ui.btn} ${ui.small}`} onClick={() => actions.rejoin(recording)}>
            Masuk ke rapat
          </button>
        )}
        {(phase === 'ready' || preparing) && (
          <button type="button" className={`${ui.btn} ${ui.small} ${ui.primary}`} disabled={preparing} onClick={() => actions.download(recording)}>
            <Download size={14} strokeWidth={1.75} aria-hidden="true" />
            <span className={styles.btnLabel}>Unduh</span>
          </button>
        )}
        {expired && (
          <button type="button" className={`${ui.btn} ${ui.small}`} onClick={() => actions.remove(recording)}>
            Hapus jejak
          </button>
        )}
        {(phase === 'ready' || preparing) && (
          <Menu
            align="end"
            width={220}
            items={menuItems(recording, actions)}
            trigger={(props) => (
              <button type="button" className={`${ui.btn} ${ui.icon}`} {...props} aria-label={`Aksi untuk ${recording.title}`}>
                <Ellipsis size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>
            )}
          />
        )}
      </div>
    </li>
  )
}
