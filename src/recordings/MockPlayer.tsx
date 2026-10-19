import { Pause, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import ui from '../dashboard/ui.module.css'
import { RecordingThumb } from './RecordingThumb'
import { formatDuration } from './retention'
import type { Recording, RecordingPhase } from './types'
import styles from './MockPlayer.module.css'

const STEP_MS = 250
/** The prototype plays a recording much faster than real time so the scrubber visibly moves */
const SPEEDUP = 20

interface MockPlayerProps {
  recording: Recording
  phase: RecordingPhase
}

/** A stand-in player: no video, but the controls, scrubber and clock behave like the real thing. */
export function MockPlayer({ recording, phase }: MockPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const length = recording.durationSec
  const playable = phase === 'ready'

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      setPosition((p) => {
        const next = p + (STEP_MS / 1000) * SPEEDUP
        if (next >= length) {
          setPlaying(false)
          return length
        }
        return next
      })
    }, STEP_MS)
    return () => window.clearInterval(id)
  }, [playing, length])

  const toggle = () => {
    if (position >= length) setPosition(0)
    setPlaying((p) => !p)
  }

  return (
    <div className={styles.player}>
      <div className={styles.frame}>
        <RecordingThumb recording={recording} phase={phase} large />
        {playable && (
          <button type="button" className={styles.big} onClick={toggle} aria-label={playing ? 'Jeda' : 'Putar'} data-playing={playing || undefined}>
            {playing ? <Pause size={26} strokeWidth={2} fill="currentColor" aria-hidden="true" /> : <Play size={26} strokeWidth={2} fill="currentColor" aria-hidden="true" />}
          </button>
        )}
      </div>
      <div className={styles.bar}>
        <button type="button" className={`${ui.btn} ${ui.icon}`} onClick={toggle} disabled={!playable} aria-label={playing ? 'Jeda' : 'Putar'}>
          {playing ? <Pause size={18} strokeWidth={1.75} aria-hidden="true" /> : <Play size={18} strokeWidth={1.75} aria-hidden="true" />}
        </button>
        <input
          type="range"
          className={styles.scrub}
          min={0}
          max={Math.max(1, length)}
          step={1}
          value={Math.round(position)}
          disabled={!playable}
          aria-label="Posisi rekaman"
          aria-valuetext={`${formatDuration(position)} dari ${formatDuration(length)}`}
          style={{ '--filled': `${length ? (position / length) * 100 : 0}%` } as CSSProperties}
          onChange={(e) => setPosition(Number(e.target.value))}
        />
        <span className={`${ui.mono} ${styles.clock}`}>
          {formatDuration(position)} / {formatDuration(length)}
        </span>
      </div>
      {!playable && <p className={styles.note}>{phase === 'processing' ? 'File sedang disiapkan. Pemutaran tersedia sebentar lagi.' : 'Rekaman belum bisa diputar.'}</p>}
    </div>
  )
}
