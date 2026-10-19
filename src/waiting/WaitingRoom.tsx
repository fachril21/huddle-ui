import { ArrowLeft, CalendarClock, CircleCheck, Hourglass, Lock, Send, TimerOff, UserX } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNow } from '../dashboard/useNow'
import type { JoinTarget } from '../dashboard/types'
import type { JoinChoice } from '../prejoin/PreJoin'
import { PreviewStage } from '../prejoin/PreviewStage'
import { StageControls } from '../prejoin/StageControls'
import { useMediaPreview } from '../prejoin/useMediaPreview'
import { useMicLevel } from '../prejoin/useMicLevel'
import prejoin from '../prejoin/PreJoin.module.css'
import { Ambient } from '../room/Ambient'
import { useFx } from '../room/MotionContext'
import { ADMITTED_HOLD_MS, isPending, waitedLabel } from './admission'
import type { Admission, AdmissionStatus } from './admission'
import styles from './WaitingRoom.module.css'

interface WaitingRoomProps {
  meeting: JoinTarget
  /** What the guest picked in the lobby; the preview keeps using it */
  choice: JoinChoice
  admission: Admission
  /** The host said yes: open the room with the mic and camera as they are now */
  onEnter: (choice: JoinChoice) => void
  onTick: (now: number) => void
  onAskAgain: () => void
  /** Back to the lobby, to change something before asking again */
  onCancel: () => void
  onHome: () => void
}

interface Copy {
  readonly icon: LucideIcon
  readonly title: string
  readonly body: (host: string) => string
}

const COPY: Record<AdmissionStatus, Copy> = {
  waiting: { icon: Hourglass, title: 'Menunggu host mengizinkan Anda masuk', body: (host) => `${host} sudah diberi tahu. Tetap di halaman ini, Anda masuk begitu diizinkan.` },
  'host-absent': { icon: CalendarClock, title: 'Host belum membuka rapat', body: (host) => `Begitu ${host} hadir dan mengizinkan Anda, rapat langsung terbuka. Anda tidak perlu mengulang.` },
  admitted: { icon: CircleCheck, title: 'Anda diizinkan masuk', body: () => 'Membuka rapat…' },
  denied: { icon: UserX, title: 'Host tidak mengizinkan Anda masuk', body: (host) => `Pastikan Anda memakai tautan yang benar. Anda boleh meminta lagi, atau hubungi ${host}.` },
  timeout: { icon: TimerOff, title: 'Belum ada yang merespons', body: (host) => `${host} mungkin sedang sibuk. Coba minta lagi, atau hubungi ${host} lewat jalur lain.` },
  locked: { icon: Lock, title: 'Rapat ini dikunci', body: (host) => `${host} mengunci rapat, jadi belum ada yang bisa masuk. Hubungi ${host} bila perlu.` },
}

/** The guest's screen while the host decides: the mirror stays, the panel says where things stand and what to do next. */
export function WaitingRoom({ meeting, choice, admission, onEnter, onTick, onAskAgain, onCancel, onHome }: WaitingRoomProps) {
  const { fx, reduced } = useFx()
  const now = useNow(1000)
  const [micOn, setMicOn] = useState(choice.micOn)
  const [camOn, setCamOn] = useState(choice.camOn)
  const primaryRef = useRef<HTMLButtonElement>(null)

  const { cameraId, micId, facing } = choice.devices
  const media = useMediaPreview({ camOn, micOn, quality: choice.cameraQuality, cameraId, micId, facing })
  const mic = useMicLevel(media.audioStream)

  const { status, since } = admission
  const pending = isPending(status)
  const copy = COPY[status]
  const Icon = copy.icon
  const host = meeting.hostName

  useEffect(() => {
    if (pending) onTick(now.getTime())
  }, [pending, now, onTick])

  // the room opens with the mic and camera exactly as the guest left them here
  useEffect(() => {
    if (status !== 'admitted') return
    const id = window.setTimeout(() => onEnter({ ...choice, micOn: micOn && media.micStatus === 'granted', camOn: camOn && media.cameraStatus === 'granted' }), reduced ? 400 : ADMITTED_HOLD_MS)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one timer per admission, not per toggle
  }, [status])

  // a verdict that needs a decision from the guest takes keyboard focus
  useEffect(() => {
    if (status === 'denied' || status === 'timeout' || status === 'locked') primaryRef.current?.focus()
  }, [status])

  const canAsk = status === 'denied' || status === 'timeout'
  const primary = canAsk && status === 'timeout' ? { label: 'Minta lagi', run: onAskAgain, icon: <Send size={16} strokeWidth={1.75} aria-hidden="true" /> } : { label: 'Kembali ke beranda', run: onHome, icon: <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" /> }

  return (
    <div className={`${prejoin.screen} ${styles.screen}`} data-motion={reduced ? 'reduced' : 'full'} data-fx={fx} data-status={status}>
      <Ambient />
      <main className={prejoin.frame}>
        <div className={prejoin.stageWrap}>
          <PreviewStage videoStream={media.videoStream} camOn={camOn} cameraStatus={media.cameraStatus} micOn={micOn} name={choice.name} mic={mic} mirrored={facing === 'user'} />
          <div className={styles.halo} aria-hidden="true" />
          <div className={prejoin.brand}>
            <span className={prejoin.wordmark}>Huddle</span>
          </div>
          <StageControls
            micOn={micOn}
            camOn={camOn}
            micStatus={media.micStatus}
            cameraStatus={media.cameraStatus}
            heard={mic.heardSignal}
            onToggleMic={() => setMicOn((on) => !on)}
            onToggleCam={() => setCamOn((on) => !on)}
          />
        </div>

        <section className={`glass-3 ${prejoin.panel} ${styles.card}`} aria-label="Ruang tunggu">
          <div className={styles.status} role="status" aria-live="polite" data-tone={status}>
            <span className={styles.badge} aria-hidden="true">
              <Icon size={22} strokeWidth={1.75} />
            </span>
            <h1>{copy.title}</h1>
            <p>{copy.body(host)}</p>
          </div>

          <dl className={styles.facts}>
            <div>
              <dt>Rapat</dt>
              <dd>
                {meeting.title} <span className={styles.code}>{meeting.code}</span>
              </dd>
            </div>
            <div>
              <dt>Host</dt>
              <dd>{host}</dd>
            </div>
            {pending && (
              <div>
                <dt>Menunggu</dt>
                <dd className={styles.timer}>{waitedLabel(now.getTime() - since)}</dd>
              </div>
            )}
          </dl>

          <div className={`${prejoin.cta} ${styles.actions}`}>
            {pending && (
              <>
                <p className={prejoin.soft}>Mic dan kamera bisa diatur sambil menunggu.</p>
                <button type="button" className={styles.quiet} onClick={onCancel}>
                  Batalkan permintaan
                </button>
              </>
            )}
            {(canAsk || status === 'locked') && (
              <>
                <button ref={primaryRef} type="button" className={prejoin.join} onClick={primary.run}>
                  {primary.icon}
                  {primary.label}
                </button>
                {canAsk && (
                  <button type="button" className={styles.quiet} onClick={status === 'timeout' ? onHome : onAskAgain}>
                    {status === 'timeout' ? 'Kembali ke beranda' : 'Minta lagi'}
                  </button>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
