import { ArrowLeft, ChevronDown, Mic, Video, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { BackgroundChoice } from '../background/backgrounds'
import { useBackground } from '../background/useBackground'
import type { JoinTarget } from '../dashboard/types'
import { useKeyboardInset, useViewport } from '../mobile/useViewport'
import { CAMERA_QUALITIES, loadCameraQuality } from '../room/cameraQuality'
import type { CameraQuality } from '../room/cameraQuality'
import type { DeviceSettings } from '../room/devices/deviceSettings'
import { Ambient } from '../room/Ambient'
import { useFx } from '../room/MotionContext'
import { canPickSpeaker } from './audioTests'
import { BackgroundSection } from './BackgroundSection'
import { CheckRow } from './CheckRow'
import { MicTest, SpeakerTest } from './DeviceTests'
import { loadPreferences } from '../settings/preferences'
import { isValidName, loadName, normalizeName, MAX_NAME_LENGTH, saveName } from './displayName'
import { MeetingInfo } from './MeetingInfo'
import { MicMeter } from './MicMeter'
import { cameraCheck, micCheck, speakerCheck, summarize } from './mediaState'
import { PreviewStage } from './PreviewStage'
import { PREJOIN_KEYS, matchPrejoinShortcut } from './prejoinShortcuts'
import { StageControls } from './StageControls'
import { useMediaPreview } from './useMediaPreview'
import { useMicLevel } from './useMicLevel'
import styles from './PreJoin.module.css'

/** What the lobby hands to the room. A device that never worked arrives switched off. */
export interface JoinChoice {
  readonly name: string
  readonly micOn: boolean
  readonly camOn: boolean
  readonly cameraQuality: CameraQuality
  /** The devices picked in the lobby, so the room starts on the same ones */
  readonly devices: DeviceSettings
  /** What sits behind the person; the room starts with the same one */
  readonly background: BackgroundChoice
}

/** The lobby: a full-screen mirror with a glass panel to check devices, name yourself, and enter. */
export function PreJoin({ meeting, onJoin, onBack }: { meeting: JoinTarget; onJoin: (choice: JoinChoice) => void; onBack: () => void }) {
  const { fx, reduced } = useFx()
  const [name, setName] = useState(loadName)
  const [nameTouched, setNameTouched] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [quality, setQuality] = useState<CameraQuality>(loadCameraQuality)
  // the defaults set in Pengaturan; a device that is no longer there falls back to the system one
  const [cameraId, setCameraId] = useState(() => loadPreferences().cameraId)
  const [micId, setMicId] = useState(() => loadPreferences().micId)
  const [speakerId, setSpeakerId] = useState(() => loadPreferences().speakerId)
  const [speakerHeard, setSpeakerHeard] = useState(false)
  const [background, setBackground] = useState<BackgroundChoice>(() => loadPreferences().background)
  // phone only: front or back camera, and whether the device checklist is unfolded (null = follow whether anything needs attention)
  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [checksOpen, setChecksOpen] = useState<boolean | null>(null)
  const { sizeClass } = useViewport()
  const phone = sizeClass === 'phone'
  const keyboard = useKeyboardInset()
  const nameRef = useRef<HTMLInputElement>(null)

  const media = useMediaPreview({ camOn, micOn, quality, cameraId, micId, facing })
  const mic = useMicLevel(media.audioStream)
  const backdrop = useBackground(media.videoStream, background)
  const { cameras, mics, speakers } = media.devices

  const nameOk = isValidName(name)
  const camStatus = camOn || media.cameraStatus !== 'granted' ? media.cameraStatus : 'granted'
  const checks = [
    cameraCheck({ status: camOn ? camStatus : 'idle' }),
    micCheck({ status: micOn ? media.micStatus : 'idle', heardSignal: mic.heardSignal }),
    speakerCheck({ confirmed: speakerHeard }),
  ]
  const summary = summarize(checks)
  const needsAttention = checks.includes('attention')
  const checksVisible = !phone || (checksOpen ?? needsAttention)
  const keyboardOpen = phone && keyboard > 0
  const flipCamera =
    cameras.length > 1
      ? () => {
          setCameraId('')
          setFacing((f) => (f === 'user' ? 'environment' : 'user'))
        }
      : undefined

  // A chosen device that disappears falls back to the system default
  useEffect(() => {
    if (cameraId && cameras.length > 0 && !cameras.some((d) => d.id === cameraId)) setCameraId('')
    if (micId && mics.length > 0 && !mics.some((d) => d.id === micId)) setMicId('')
    if (speakerId && speakers.length > 0 && !speakers.some((d) => d.id === speakerId)) setSpeakerId('')
  }, [cameras, mics, speakers, cameraId, micId, speakerId])

  // Land on the name field only when it's empty, so a returning user can press Enter right away
  useEffect(() => {
    // on a touch screen, focusing here would pop the keyboard over the picture before the user has seen it
    if (!nameOk && !window.matchMedia('(pointer: coarse)').matches) nameRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- first paint only
  }, [])

  const join = () => {
    if (!nameOk) {
      setNameTouched(true)
      nameRef.current?.focus()
      return
    }
    const clean = normalizeName(name)
    saveName(clean)
    onJoin({
      name: clean,
      micOn: micOn && media.micStatus === 'granted',
      camOn: camOn && media.cameraStatus === 'granted',
      cameraQuality: quality,
      devices: { cameraId, micId, speakerId, facing },
      background: backdrop.applied,
    })
  }

  const toggleMic = () => setMicOn((on) => !on)
  const toggleCam = () => setCamOn((on) => !on)
  const handlers = useRef({ join, mic: toggleMic, camera: toggleCam })
  useEffect(() => {
    handlers.current = { join, mic: toggleMic, camera: toggleCam }
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const hit = matchPrejoinShortcut(e)
      if (!hit) return
      e.preventDefault()
      handlers.current[hit]()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const showNameError = nameTouched && !nameOk

  return (
    <div className={styles.screen} data-motion={reduced ? 'reduced' : 'full'} data-fx={fx} data-keyboard={keyboardOpen || undefined} style={{ '--kb': `${keyboard}px` } as CSSProperties}>
      <Ambient />
      <main className={styles.frame}>
        <div className={styles.stageWrap}>
          <PreviewStage videoStream={backdrop.stream} camOn={camOn} cameraStatus={media.cameraStatus} micOn={micOn} name={name} mic={mic} mirrored={facing === 'user'} />
          <div className={styles.brand}>
            <span className={styles.wordmark}>Huddle</span>
            <button type="button" className={styles.back} onClick={onBack}>
              <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" />
              Beranda
            </button>
          </div>
          {!keyboardOpen && (
          <StageControls
            micOn={micOn}
            camOn={camOn}
            micStatus={media.micStatus}
            cameraStatus={media.cameraStatus}
            heard={mic.heardSignal}
            onToggleMic={toggleMic}
            onToggleCam={toggleCam}
            onFlipCamera={flipCamera}
          />
          )}
        </div>

        <form className={`glass-3 ${styles.panel}`} onSubmit={(e) => {
            e.preventDefault()
            join()
          }} noValidate aria-label="Persiapan bergabung">
          <MeetingInfo meeting={meeting} />

          <div className={styles.field}>
            <label htmlFor="display-name">Nama tampilan</label>
            <input
              ref={nameRef}
              id="display-name"
              type="text"
              value={name}
              maxLength={MAX_NAME_LENGTH}
              autoComplete="nickname"
              placeholder="Nama yang dilihat peserta lain"
              aria-invalid={showNameError}
              aria-describedby={showNameError ? 'name-error' : undefined}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setNameTouched(true)}
            />
            {showNameError && (
              <p id="name-error" className={styles.error} role="alert">
                Isi nama dulu supaya peserta lain tahu siapa Anda.
              </p>
            )}
          </div>

          <section className={styles.checks} aria-labelledby="checks-title">
            {phone ? (
              <button type="button" className={styles.checksToggle} aria-expanded={checksVisible} aria-controls="checks-list" onClick={() => setChecksOpen(!checksVisible)}>
                <h2 id="checks-title">Cek perangkat</h2>
                <span className={styles.summary} data-ready={summary.allReady}>
                  {summary.label}
                </span>
                <ChevronDown size={18} strokeWidth={1.75} aria-hidden="true" className={styles.chevron} />
              </button>
            ) : (
              <div className={styles.checksHead}>
                <h2 id="checks-title">Cek perangkat</h2>
                <span className={styles.summary} data-ready={summary.allReady}>
                  {summary.label}
                </span>
              </div>
            )}
            <ul id="checks-list" hidden={!checksVisible}>
              <CheckRow
                icon={<Video size={16} strokeWidth={1.75} />}
                title="Kamera"
                state={checks[0]}
                options={cameras}
                value={cameraId}
                onChange={setCameraId}
                issue={camOn ? media.cameraStatus : undefined}
                onRetry={() => media.retry('camera')}
              >
                <div className={styles.segment} role="group" aria-label="Kualitas kamera">
                  {CAMERA_QUALITIES.map((q) => (
                    <button key={q.id} type="button" aria-pressed={quality === q.id} onClick={() => setQuality(q.id)}>
                      {q.label}
                      <small>{q.resolution}</small>
                    </button>
                  ))}
                </div>
              </CheckRow>
              <CheckRow
                icon={<Mic size={16} strokeWidth={1.75} />}
                title="Mikrofon"
                state={checks[1]}
                options={mics}
                value={micId}
                onChange={setMicId}
                issue={micOn ? media.micStatus : undefined}
                onRetry={() => media.retry('mic')}
              >
                <div className={styles.meterLine}>
                  <MicMeter mic={mic} active={micOn && media.micStatus === 'granted'} />
                </div>
                <MicTest stream={micOn ? media.audioStream : null} speakerId={speakerId} />
              </CheckRow>
              <CheckRow
                icon={<Volume2 size={16} strokeWidth={1.75} />}
                title="Speaker"
                state={checks[2]}
                options={speakers}
                value={speakerId}
                onChange={(id) => {
                  setSpeakerId(id)
                  setSpeakerHeard(false)
                }}
                hidePicker={!canPickSpeaker() || speakers.length === 0}
              >
                <SpeakerTest speakerId={speakerId} confirmed={speakerHeard} onConfirm={setSpeakerHeard} />
              </CheckRow>
            </ul>
          </section>

          <BackgroundSection choice={background} onChange={setBackground} background={backdrop} camOn={camOn} />

          <div className={styles.cta}>
            {needsAttention && <p className={styles.soft}>Perangkat bisa diatur nanti. Anda tetap bisa masuk dulu.</p>}
            <button type="submit" className={styles.join} aria-disabled={!nameOk || undefined} aria-keyshortcuts={PREJOIN_KEYS.join}>
              {meeting.needsApproval ? 'Minta bergabung' : 'Masuk'}
              <kbd className="keycap" aria-hidden="true">
                Enter
              </kbd>
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
