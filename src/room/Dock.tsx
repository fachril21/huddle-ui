import {
  AudioLines,
  Ellipsis,
  Hand,
  Handshake,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  SmilePlus,
  Video,
  VideoOff,
} from 'lucide-react'
import type { DockToggle, Participant, RoomState } from '../state/types'
import { DockButton } from './DockButton'
import styles from './Dock.module.css'

interface DockProps {
  self: Participant
  toggles: RoomState['toggles']
  onToggleMic: () => void
  onToggleCam: () => void
  onToggle: (key: DockToggle) => void
}

const ICON = { size: 22, strokeWidth: 1.75, 'aria-hidden': true } as const

/** Floating glass-3 capsule: [mic cam] | [share reaction hand high-five soundboard more] | [leave]. Buttons only flip view state (M1). */
export function Dock({ self, toggles, onToggleMic, onToggleCam, onToggle }: DockProps) {
  return (
    <nav className={`glass-3 ${styles.dock}`} aria-label="Kontrol meeting">
      <DockButton
        icon={self.micOn ? <Mic {...ICON} /> : <MicOff {...ICON} />}
        label={self.micOn ? 'Matikan mikrofon' : 'Nyalakan mikrofon'}
        tone={self.micOn ? 'default' : 'off'}
        onClick={onToggleMic}
      />
      <DockButton
        icon={self.camOn ? <Video {...ICON} /> : <VideoOff {...ICON} />}
        label={self.camOn ? 'Matikan kamera' : 'Nyalakan kamera'}
        tone={self.camOn ? 'default' : 'off'}
        onClick={onToggleCam}
      />
      <span className={styles.sep} aria-hidden="true" />
      <DockButton icon={<MonitorUp {...ICON} />} label="Bagikan layar" pressed={toggles.share} onClick={() => onToggle('share')} />
      <DockButton icon={<SmilePlus {...ICON} />} label="Reaction" pressed={toggles.reaction} onClick={() => onToggle('reaction')} />
      <DockButton icon={<Hand {...ICON} />} label="Angkat tangan" pressed={toggles.hand} onClick={() => onToggle('hand')} />
      <DockButton icon={<Handshake {...ICON} />} label="High five" pressed={toggles.highFive} onClick={() => onToggle('highFive')} />
      <DockButton icon={<AudioLines {...ICON} />} label="Soundboard" pressed={toggles.soundboard} onClick={() => onToggle('soundboard')} />
      <DockButton icon={<Ellipsis {...ICON} />} label="Lainnya" pressed={toggles.more} onClick={() => onToggle('more')} />
      <span className={styles.sep} aria-hidden="true" />
      <DockButton icon={<PhoneOff {...ICON} />} label="Keluar" tone="danger" wide />
    </nav>
  )
}
