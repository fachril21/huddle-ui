import { Hand, Mic, MicOff, MonitorUp, MonitorOff, PhoneOff, Video, VideoOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { EMOJI } from '../emoji/registry'
import { REACTIONS } from '../room/reactions'
import type { Participant, ReactionName } from '../state/types'
import styles from './MiniControls.module.css'

interface MiniControlsProps {
  self: Participant
  sharing: boolean
  /** Why sharing is not allowed right now, if it is not */
  shareDisabledReason?: string
  onToggleMic: () => void
  onToggleCam: () => void
  onToggleHand: () => void
  onReact: (name: ReactionName) => void
  onShare: () => void
  onLeave: () => void
}

const ICON = { size: 20, strokeWidth: 1.85, 'aria-hidden': true } as const

interface MiniButtonProps {
  label: string
  icon: ReactNode
  pressed?: boolean
  tone?: 'default' | 'off' | 'danger' | 'share'
  disabled?: boolean
  onClick: () => void
}

function MiniButton({ label, icon, pressed, tone = 'default', disabled, onClick }: MiniButtonProps) {
  return (
    <button type="button" className={styles.btn} data-tone={tone} aria-label={label} title={label} aria-pressed={pressed} aria-disabled={disabled || undefined} onClick={disabled ? undefined : onClick}>
      {icon}
    </button>
  )
}

/** Reactions on top, then mic, camera, hand, share and leave. Toggles only: device menus stay in the room. */
export function MiniControls({ self, sharing, shareDisabledReason, onToggleMic, onToggleCam, onToggleHand, onReact, onShare, onLeave }: MiniControlsProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.reactions} role="group" aria-label="Reaction">
        {REACTIONS.map((r) => (
          <button key={r.name} type="button" className={styles.emoji} aria-label={r.label} title={r.label} onClick={() => onReact(r.name)}>
            <span aria-hidden="true">{EMOJI[r.emoji]}</span>
          </button>
        ))}
      </div>
      <nav className={styles.bar} aria-label="Kontrol meeting">
        <MiniButton label={self.micOn ? 'Matikan mikrofon' : 'Nyalakan mikrofon'} tone={self.micOn ? 'default' : 'off'} icon={self.micOn ? <Mic {...ICON} /> : <MicOff {...ICON} />} onClick={onToggleMic} />
        <MiniButton label={self.camOn ? 'Matikan kamera' : 'Nyalakan kamera'} tone={self.camOn ? 'default' : 'off'} icon={self.camOn ? <Video {...ICON} /> : <VideoOff {...ICON} />} onClick={onToggleCam} />
        <MiniButton label={self.hand !== null ? 'Turunkan tangan' : 'Angkat tangan'} pressed={self.hand !== null} icon={<Hand {...ICON} />} onClick={onToggleHand} />
        <MiniButton
          label={sharing ? 'Berhenti berbagi layar' : (shareDisabledReason ?? 'Bagikan layar')}
          tone={sharing ? 'share' : 'default'}
          pressed={sharing}
          disabled={!sharing && shareDisabledReason !== undefined}
          icon={sharing ? <MonitorOff {...ICON} /> : <MonitorUp {...ICON} />}
          onClick={onShare}
        />
        <MiniButton label="Keluar dari meeting" tone="danger" icon={<PhoneOff {...ICON} />} onClick={onLeave} />
      </nav>
    </div>
  )
}
