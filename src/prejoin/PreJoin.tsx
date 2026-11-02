import { ArrowLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { BackgroundChoice } from '../background/backgrounds'
import { useBackground } from '../background/useBackground'
import type { JoinTarget } from '../dashboard/types'
import { useKeyboardInset, useViewport } from '../mobile/useViewport'
import { loadCameraQuality } from '../room/cameraQuality'
import type { CameraQuality } from '../room/cameraQuality'
import { CameraSettingsBody } from '../room/devices/CameraSettingsBody'
import type { DeviceSettings } from '../room/devices/deviceSettings'
import { MicSettingsBody } from '../room/devices/MicSettingsBody'
import { Ambient } from '../room/Ambient'
import { useFx } from '../room/MotionContext'
import { loadPreferences } from '../settings/preferences'
import { MicTest } from './DeviceTests'
import { DeviceStatus } from './DeviceStatus'
import { isValidName, loadName, normalizeName, MAX_NAME_LENGTH, loadRemember, persistName } from './displayName'
import { MeetingInfo } from './MeetingInfo'
import { deviceProblems } from './mediaState'
import { PreviewStage } from './PreviewStage'
import { PREJOIN_KEYS, matchPrejoinShortcut } from './prejoinShortcuts'
import { StageControls } from './StageControls'
import type { DevicePanel } from './StageControls'
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
  const [remember, setRemember] = useState(loadRemember)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [quality, setQuality] = useState<CameraQuality>(loadCameraQuality)
  // the defaults set in Pengaturan; a device that is no longer there falls back to the system one
  const [cameraId, setCameraId] = useState(() => loadPreferences().cameraId)
  const [micId, setMicId] = useState(() => loadPreferences().micId)
  const [speakerId, setSpeakerId] = useState(() => loadPreferences().speakerId)
  const [speakerHeard, setSpeakerHeard] = useState(false)
  const [background, setBackground] = useState<BackgroundChoice>(() => loadPreferences().background)
  // phone only: front or back camera
  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  // which device menu is open on the stage; the status line beside the form can open one too
  const [panel, setPanel] = useState<DevicePanel | null>(null)
  const { sizeClass } = useViewport()
  const phone = sizeClass === 'phone'
  const keyboard = useKeyboardInset()
  const nameRef = useRef<HTMLInputElement>(null)

  const media = useMediaPreview({ camOn, micOn, quality, cameraId, micId, facing })
  const mic = useMicLevel(media.audioStream)
  const backdrop = useBackground(media.videoStream, background)
  const { cameras, mics, speakers } = media.devices

  const nameOk = isValidName(name)
  const facts = { camOn, cameraStatus: media.cameraStatus, micOn, micStatus: media.micStatus }
  const problems = deviceProblems(facts)
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
    persistName(clean, remember)
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

  const micPanel = (
    <MicSettingsBody
      micOn={micOn}
      micId={micId}
      speakerId={speakerId}
      mics={mics}
      speakers={speakers}
      micStatus={media.micStatus}
      level={mic}
      speakerHeard={speakerHeard}
      onSpeakerHeard={setSpeakerHeard}
      onMicDevice={setMicId}
      onSpeakerDevice={setSpeakerId}
      onRetry={() => media.retry('mic')}
      onTurnOn={() => setMicOn(true)}
      extra={<MicTest stream={micOn ? media.audioStream : null} speakerId={speakerId} />}
    />
  )
  const cameraPanel = (
    <CameraSettingsBody
      cameraId={cameraId}
      cameras={cameras}
      cameraStatus={media.cameraStatus}
      camOn={camOn}
      quality={quality}
      background={background}
      backdrop={backdrop}
      weakConnection={false}
      phone={phone}
      onDevice={setCameraId}
      onQuality={setQuality}
      onBackground={setBackground}
      onFlip={() => flipCamera?.()}
      onRetry={() => media.retry('camera')}
    />
  )

  return (
    <div className={styles.screen} data-motion={reduced ? 'reduced' : 'full'} data-fx={fx} data-keyboard={keyboardOpen || undefined} style={{ '--kb': `${keyboard}px` } as CSSProperties}>
      <Ambient />
      <main className={styles.frame}>
        <div className={styles.brand}>
          <div className={styles.brandRow}>
            <span className={styles.wordmark}>Huddle</span>
            <button type="button" className={styles.back} onClick={onBack}>
              <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" />
              Beranda
            </button>
          </div>
          {/* the picture alone looks like being in the room; this says it is only a mirror */}
          <p className={`glass-1 ${styles.preview}`}>
            <i aria-hidden="true" />
            Pratinjau · belum terlihat peserta lain
          </p>
        </div>
        <div className={styles.stageWrap}>
          <PreviewStage videoStream={backdrop.stream} camOn={camOn} cameraStatus={media.cameraStatus} micOn={micOn} name={name} mic={mic} mirrored={facing === 'user'} />
          {!keyboardOpen && (
            <StageControls
              micOn={micOn}
              camOn={camOn}
              micStatus={media.micStatus}
              cameraStatus={media.cameraStatus}
              heard={mic.heardSignal}
              open={panel}
              onOpenChange={setPanel}
              asSheet={sizeClass !== 'desktop'}
              micPanel={micPanel}
              cameraPanel={cameraPanel}
              micProblem={problems.some((p) => p.kind === 'mic')}
              cameraProblem={problems.some((p) => p.kind === 'camera')}
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
            <label className={styles.remember}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Ingat nama untuk meeting berikutnya
            </label>
          </div>

          <DeviceStatus facts={facts} onOpen={setPanel} />

          <div className={styles.cta}>
            {problems.length > 0 && <p className={styles.soft}>Perangkat bisa diatur nanti. Anda tetap bisa masuk dulu.</p>}
            <button type="submit" className={styles.join} aria-disabled={!nameOk || undefined} aria-keyshortcuts={PREJOIN_KEYS.join}>
              {meeting.needsApproval ? 'Minta masuk ke ruangan' : 'Masuk ke ruangan'}
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
