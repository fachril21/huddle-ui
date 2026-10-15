import { Mic, MicOff, SwitchCamera, Video, VideoOff } from 'lucide-react'
import { DockButton } from '../room/DockButton'
import { PREJOIN_KEYS } from './prejoinShortcuts'
import type { MediaStatus } from './mediaState'
import styles from './StageControls.module.css'

const ICON = { size: 22, strokeWidth: 1.75, 'aria-hidden': true } as const

interface StageControlsProps {
  micOn: boolean
  camOn: boolean
  micStatus: MediaStatus
  cameraStatus: MediaStatus
  /** True once the mic has caught a voice */
  heard: boolean
  onToggleMic: () => void
  onToggleCam: () => void
  /** Present only when the device has more than one camera */
  onFlipCamera?: () => void
}

/** What to tell the user to do next with their voice; empty when there's nothing to add. */
function micHint(micOn: boolean, status: MediaStatus, heard: boolean): string {
  if (!micOn) return 'Mikrofon mati. Nyalakan untuk mengetes.'
  if (status !== 'granted') return ''
  return heard ? 'Suaramu terdengar. Mikrofon siap.' : 'Coba bicara. Bar mikrofon harus bergerak.'
}

/** Floating glass dock over the preview: mic, camera, and a live line about what the mic hears. */
export function StageControls({ micOn, camOn, micStatus, cameraStatus, heard, onToggleMic, onToggleCam, onFlipCamera }: StageControlsProps) {
  const micBlocked = micStatus === 'denied' || micStatus === 'no-device'
  const camBlocked = cameraStatus === 'denied' || cameraStatus === 'no-device'
  const hint = micHint(micOn, micStatus, heard)

  return (
    <div className={styles.wrap}>
      <div className={`glass-3 ${styles.dock}`} role="group" aria-label="Kontrol perangkat">
        <DockButton
          icon={micOn ? <Mic {...ICON} /> : <MicOff {...ICON} />}
          label={micOn ? 'Matikan mikrofon' : 'Nyalakan mikrofon'}
          tone={micOn ? 'default' : 'off'}
          shortcut={PREJOIN_KEYS.mic}
          disabledReason={micBlocked ? 'Mikrofon belum tersedia' : undefined}
          onClick={onToggleMic}
        />
        <DockButton
          icon={camOn ? <Video {...ICON} /> : <VideoOff {...ICON} />}
          label={camOn ? 'Matikan kamera' : 'Nyalakan kamera'}
          tone={camOn ? 'default' : 'off'}
          shortcut={PREJOIN_KEYS.camera}
          disabledReason={camBlocked ? 'Kamera belum tersedia' : undefined}
          onClick={onToggleCam}
        />
        {onFlipCamera && camOn && <DockButton icon={<SwitchCamera {...ICON} />} label="Balik kamera" onClick={onFlipCamera} />}
      </div>
      <p className={`glass-1 ${styles.hint}`} role="status" data-heard={heard} hidden={!hint}>
        {hint}
      </p>
    </div>
  )
}
