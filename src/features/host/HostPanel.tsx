import { Circle, Megaphone, Pause, Play, Square } from 'lucide-react'
import { useState } from 'react'
import type { HostState } from '../../state/types'
import styles from './HostPanel.module.css'

interface HostPanelProps {
  host: HostState
  soundboardAllowed: boolean
  onDecide: (guestId: string, admit: boolean) => void
  onLock: (on: boolean) => void
  onRestrictShare: (on: boolean) => void
  onSoundboard: (on: boolean) => void
  onMuteAll: () => void
  onAnnounce: (text: string) => void
  onRecording: (state: 'on' | 'paused' | 'off') => void
}

const MAX_ANNOUNCEMENT = 140

/** Host tools (PRD 8.8): waiting room, moderation switches, announcement, recording. Actions are mock. */
export function HostPanel({ host, soundboardAllowed, onDecide, onLock, onRestrictShare, onSoundboard, onMuteAll, onAnnounce, onRecording }: HostPanelProps) {
  const [text, setText] = useState('')

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onAnnounce(text)
    setText('')
  }

  return (
    <div className={styles.wrap}>
      <section aria-label="Tamu menunggu">
        <h3 className={styles.sub}>Tamu menunggu ({host.waiting.length})</h3>
        {host.waiting.length === 0 ? (
          <p className={styles.empty}>Tidak ada tamu yang menunggu.</p>
        ) : (
          <ul className={styles.guests}>
            {host.waiting.map((g) => (
              <li key={g.id}>
                <span className={styles.guestName}>{g.name}</span>
                <button type="button" className={styles.reject} aria-label={`Tolak ${g.name}`} onClick={() => onDecide(g.id, false)}>
                  Tolak
                </button>
                <button type="button" className={styles.admit} aria-label={`Setujui ${g.name}`} onClick={() => onDecide(g.id, true)}>
                  Setujui
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Moderasi">
        <h3 className={styles.sub}>Moderasi</h3>
        <Switch label="Kunci meeting" on={host.locked} onChange={onLock} />
        <Switch label="Batasi berbagi layar (hanya host)" on={host.restrictShare} onChange={onRestrictShare} />
        <Switch label="Izinkan soundboard" on={soundboardAllowed} onChange={onSoundboard} />
        <button type="button" className={styles.outline} onClick={onMuteAll}>
          Bisukan semua
        </button>
      </section>

      <section aria-label="Pengumuman">
        <h3 className={styles.sub}>Pengumuman</h3>
        <form className={styles.announce} onSubmit={send}>
          <input value={text} maxLength={MAX_ANNOUNCEMENT} placeholder="Tulis pengumuman untuk semua" aria-label="Isi pengumuman" onChange={(e) => setText(e.target.value)} />
          <button type="submit" className={styles.admit} disabled={!text.trim()}>
            <Megaphone size={16} strokeWidth={1.75} aria-hidden="true" />
            Kirim
          </button>
        </form>
      </section>

      <section aria-label="Rekaman">
        <h3 className={styles.sub}>Rekaman</h3>
        <div className={styles.rec}>
          {host.recording === 'off' ? (
            <button type="button" className={styles.admit} onClick={() => onRecording('on')}>
              <Circle size={14} strokeWidth={2} aria-hidden="true" className={styles.recDot} />
              Mulai merekam
            </button>
          ) : (
            <>
              <button type="button" className={styles.outline} onClick={() => onRecording(host.recording === 'on' ? 'paused' : 'on')}>
                {host.recording === 'on' ? <Pause size={14} strokeWidth={2} aria-hidden="true" /> : <Play size={14} strokeWidth={2} aria-hidden="true" />}
                {host.recording === 'on' ? 'Jeda' : 'Lanjutkan'}
              </button>
              <button type="button" className={styles.stop} onClick={() => onRecording('off')}>
                <Square size={14} strokeWidth={2} aria-hidden="true" />
                Hentikan
              </button>
            </>
          )}
          <span className={styles.recState} role="status">
            {host.recording === 'on' ? 'Sedang merekam' : host.recording === 'paused' ? 'Rekaman dijeda' : 'Tidak merekam'}
          </span>
        </div>
      </section>
    </div>
  )
}

function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} className={styles.switch} onClick={() => onChange(!on)}>
      <span>{label}</span>
      <i aria-hidden="true" />
    </button>
  )
}
