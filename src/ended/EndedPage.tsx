import { ArrowLeft, Film, LogOut, PhoneOff, RotateCw, UserX } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import type { JoinTarget } from '../dashboard/types'
import { Ambient } from '../room/Ambient'
import { useFx } from '../room/MotionContext'
import { durationLabel, endCopy } from './endedCopy'
import type { EndPhase } from './endedCopy'
import { RatingStrip } from './RatingStrip'
import styles from './EndedPage.module.css'

interface EndedPageProps {
  meeting: JoinTarget
  phase: EndPhase
  /** performance.now() when this person entered the room */
  joinedAt: number
  othersInRoom: number
  selfIsHost: boolean
  recordingNote: string | null
  onRejoin: () => void
  onHome: () => void
  onRecordings: () => void
}

const ICON: Record<EndPhase, LucideIcon> = { left: LogOut, ended: PhoneOff, removed: UserX }

/** What the person sees after the room: why it stopped, the way back in, and where the recording went. */
export function EndedPage({ meeting, phase, joinedAt, othersInRoom, selfIsHost, recordingNote, onRejoin, onHome, onRecordings }: EndedPageProps) {
  const { reduced } = useFx()
  // the page opens the moment the meeting stops, so mounting time is the leaving time
  const [stayedMs] = useState(() => performance.now() - joinedAt)
  const copy = endCopy(phase, { hostName: meeting.hostName, selfIsHost, othersInRoom })
  const Icon = ICON[phase]
  const removed = phase === 'removed'

  return (
    <div className={styles.screen} data-phase={phase} data-motion={reduced ? 'reduced' : 'full'}>
      <Ambient />
      <main className={styles.frame}>
        <section className={`glass-3 ${styles.card}`} aria-labelledby="ended-title">
          <div className={styles.status} role="status">
            <span className={styles.badge} aria-hidden="true">
              <svg className={styles.ring} viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="26" pathLength="1" />
              </svg>
              <Icon size={22} strokeWidth={1.75} />
            </span>
            <h1 id="ended-title">{copy.title}</h1>
            <p>{copy.body}</p>
          </div>

          <dl className={styles.facts}>
            <div>
              <dt>Rapat</dt>
              <dd>
                {meeting.title} <span className={styles.code}>{meeting.code}</span>
              </dd>
            </div>
            <div>
              <dt>Anda ikut selama</dt>
              <dd>{durationLabel(stayedMs)}</dd>
            </div>
            {phase === 'left' && othersInRoom > 0 && (
              <div>
                <dt>Masih di ruangan</dt>
                <dd>{othersInRoom} peserta</dd>
              </div>
            )}
          </dl>

          {recordingNote && !removed && (
            <div className={styles.recording}>
              <Film size={18} strokeWidth={1.75} aria-hidden="true" />
              <p>{recordingNote}</p>
              <button type="button" className={styles.link} onClick={onRecordings}>
                Buka Rekaman
              </button>
            </div>
          )}

          <div className={styles.actions}>
            {removed ? (
              <>
                <button type="button" autoFocus className={styles.primary} onClick={onHome}>
                  <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" />
                  Kembali ke beranda
                </button>
                <button type="button" className={styles.quiet} onClick={onRejoin}>
                  Minta bergabung lagi
                </button>
              </>
            ) : (
              <>
                <button type="button" autoFocus className={styles.primary} onClick={onRejoin}>
                  <RotateCw size={18} strokeWidth={1.75} aria-hidden="true" />
                  Gabung lagi
                </button>
                <button type="button" className={styles.quiet} onClick={onHome}>
                  Kembali ke beranda
                </button>
              </>
            )}
          </div>

          {!removed && <RatingStrip />}
        </section>
      </main>
    </div>
  )
}
