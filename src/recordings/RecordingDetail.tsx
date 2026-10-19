import { Download, Link2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { formatClock, formatLongDay } from '../dashboard/schedule'
import ui from '../dashboard/ui.module.css'
import { Countdown } from './Countdown'
import { isOwner, ownerLabel } from './labels'
import { MockPlayer } from './MockPlayer'
import type { RecordingActions } from './recordingActions'
import { formatDuration, formatSize, phaseOf, remainingMs, stopReasonLabel } from './retention'
import type { Recording } from './types'
import styles from './RecordingDetail.module.css'

interface RecordingDetailProps {
  recording: Recording
  now: Date
  /** Start already asking whether to delete (from the row's menu) */
  askDelete: boolean
  actions: RecordingActions
}

const ICON = { size: 16, strokeWidth: 1.75, 'aria-hidden': true } as const

function at(iso: string): string {
  const d = new Date(iso)
  return `${formatLongDay(d)}, ${formatClock(d)}`
}

/** Everything about one recording: the player, how long it stays, who was there, and what can be done with it. */
export function RecordingDetail({ recording, now, askDelete, actions }: RecordingDetailProps) {
  const [confirming, setConfirming] = useState(askDelete)
  const phase = phaseOf(recording, now)
  const remaining = remainingMs(recording, now)
  const owner = isOwner(recording)
  const stored = phase === 'ready' || phase === 'processing'

  return (
    <div className={styles.detail}>
      <MockPlayer key={recording.id} recording={recording} phase={phase} />

      <header className={styles.head}>
        <h3>{recording.title}</h3>
        <p>
          {ownerLabel(recording)} · <span className={ui.mono}>{recording.code}</span>
        </p>
      </header>

      {stored && remaining !== null && (
        <section className={styles.keep} aria-label="Masa simpan">
          <Countdown remaining={remaining} large />
          <p>Rekaman dihapus otomatis 24 jam setelah rapat selesai. Unduh sebelum waktu habis.</p>
        </section>
      )}
      {phase === 'live' && (
        <section className={styles.keep} aria-label="Status">
          <p>Sedang merekam. Jam 24 jam mulai berjalan setelah rapat selesai atau ruangan kosong.</p>
        </section>
      )}
      {phase === 'expired' && (
        <section className={styles.keep} aria-label="Status">
          <p>File rekaman ini sudah dihapus karena melewati 24 jam. Hanya catatan singkatnya yang tersisa selama 7 hari.</p>
        </section>
      )}

      <dl className={styles.facts}>
        <div>
          <dt>Dimulai</dt>
          <dd>{at(recording.startedAt)}</dd>
        </div>
        {recording.stoppedAt && (
          <div>
            <dt>Berhenti</dt>
            <dd>{at(recording.stoppedAt)}</dd>
          </div>
        )}
        <div>
          <dt>Durasi</dt>
          <dd className={ui.mono}>{formatDuration(recording.durationSec)}</dd>
        </div>
        {phase !== 'expired' && (
          <div>
            <dt>Ukuran</dt>
            <dd className={ui.mono}>{formatSize(recording.sizeMb)}</dd>
          </div>
        )}
        {recording.stopReason && (
          <div>
            <dt>Berhenti karena</dt>
            <dd>{stopReasonLabel(recording.stopReason)}</dd>
          </div>
        )}
        <div>
          <dt>Peserta ({recording.participants.length})</dt>
          <dd>{recording.participants.join(', ')}</dd>
        </div>
      </dl>

      <div className={styles.actions}>
        {stored && (
          <>
            <button type="button" className={`${ui.btn} ${ui.primary}`} disabled={phase === 'processing'} onClick={() => actions.download(recording)}>
              <Download {...ICON} />
              Unduh
            </button>
            <button type="button" className={ui.btn} onClick={() => actions.copyLink(recording)}>
              <Link2 {...ICON} />
              Salin tautan
            </button>
          </>
        )}
        {phase === 'live' && (
          <button type="button" className={`${ui.btn} ${ui.primary}`} onClick={() => actions.rejoin(recording)}>
            Masuk ke rapat
          </button>
        )}
        {phase === 'expired' && (
          <button type="button" className={ui.btn} onClick={() => actions.remove(recording)}>
            Hapus jejak
          </button>
        )}
      </div>

      {stored && owner && (
        <div className={styles.danger}>
          {confirming ? (
            <div className={styles.confirm} role="alertdialog" aria-label="Hapus rekaman sekarang">
              <p>Hapus “{recording.title}” sekarang? File tidak bisa dipulihkan.</p>
              <div>
                <button type="button" className={`${ui.btn} ${ui.danger}`} autoFocus onClick={() => actions.remove(recording)}>
                  Hapus sekarang
                </button>
                <button type="button" className={ui.btn} onClick={() => setConfirming(false)}>
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className={`${ui.btn} ${ui.small} ${styles.ghostDanger}`} onClick={() => setConfirming(true)}>
              <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
              Hapus sekarang
            </button>
          )}
        </div>
      )}
    </div>
  )
}
