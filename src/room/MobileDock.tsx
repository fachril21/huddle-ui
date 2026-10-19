import { Ellipsis, MessageCircle, Mic, MicOff, PhoneOff, SmilePlus, Video, VideoOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { Flat } from '../mobile/Flat'
import { Sheet } from '../mobile/Sheet'
import type { DockToggle, Participant, ReactionName, RoomState } from '../state/types'
import { MoreSheet } from './MoreSheet'
import type { MoreAction } from './MoreSheet'
import { ReactionPicker } from './ReactionPicker'
import styles from './MobileDock.module.css'

interface MobileDockProps {
  self: Participant
  toggles: RoomState['toggles']
  unreadChat: number
  onToggleMic: () => void
  onToggleCam: () => void
  onToggle: (key: DockToggle) => void
  onClose: (key: DockToggle) => void
  onReact: (name: ReactionName) => void
  onHighFive: () => void
  onChat: () => void
  /** What "Lainnya" offers, and the settings shown under it */
  actions: readonly MoreAction[]
  settings: ReactNode
  soundboard: ReactNode
  mic: ReactNode
  camera: ReactNode
  leave: ReactNode
}

const ICON = { size: 22, strokeWidth: 1.75, 'aria-hidden': true } as const

interface BarButtonProps {
  icon: ReactNode
  label: string
  /** Short word shown under the icon */
  caption: string
  tone?: 'default' | 'off' | 'danger'
  pressed?: boolean
  badge?: number
  onClick: () => void
}

function BarButton({ icon, label, caption, tone = 'default', pressed, badge, onClick }: BarButtonProps) {
  return (
    <button type="button" className={styles.btn} data-tone={tone} aria-label={badge ? `${label}, ${badge} baru` : label} aria-pressed={pressed} onClick={onClick}>
      {icon}
      <span className={styles.caption}>{caption}</span>
      {badge ? <span className={styles.badge}>{badge > 9 ? '9+' : badge}</span> : null}
    </button>
  )
}

/**
 * The phone's control bar: the six things needed in a meeting, labelled, in thumb reach. Everything else lives in
 * "Lainnya". Each popover of the desktop dock becomes a bottom sheet here.
 */
export function MobileDock({ self, toggles, unreadChat, onToggleMic, onToggleCam, onToggle, onClose, onReact, onHighFive, onChat, actions, settings, soundboard, mic, camera, leave }: MobileDockProps) {
  return (
    <>
      <nav className={`glass-3 ${styles.dock}`} aria-label="Kontrol meeting">
        <BarButton
          icon={self.micOn ? <Mic {...ICON} /> : <MicOff {...ICON} />}
          label={self.micOn ? 'Matikan mikrofon' : 'Nyalakan mikrofon'}
          caption="Mic"
          tone={self.micOn ? 'default' : 'off'}
          onClick={onToggleMic}
        />
        <BarButton
          icon={self.camOn ? <Video {...ICON} /> : <VideoOff {...ICON} />}
          label={self.camOn ? 'Matikan kamera' : 'Nyalakan kamera'}
          caption="Kamera"
          tone={self.camOn ? 'default' : 'off'}
          onClick={onToggleCam}
        />
        <BarButton icon={<SmilePlus {...ICON} />} label="Reaction" caption="Reaksi" pressed={toggles.reaction} onClick={() => onToggle('reaction')} />
        <BarButton icon={<MessageCircle {...ICON} />} label="Chat" caption="Chat" badge={unreadChat} onClick={onChat} />
        <BarButton icon={<Ellipsis {...ICON} />} label="Lainnya" caption="Lainnya" pressed={toggles.more} onClick={() => onToggle('more')} />
        <span className={styles.gap} aria-hidden="true" />
        <BarButton icon={<PhoneOff {...ICON} />} label="Keluar" caption="Keluar" tone="danger" onClick={() => onToggle('leave')} />
      </nav>

      {toggles.reaction && (
        <Sheet title="Reaction" onClose={() => onClose('reaction')}>
          <Flat>
            <ReactionPicker
              onReact={(name) => {
                onReact(name)
                onClose('reaction')
              }}
              onHighFive={() => {
                onHighFive()
                onClose('reaction')
              }}
            />
          </Flat>
        </Sheet>
      )}
      {toggles.soundboard && (
        <Sheet title="Soundboard" size="tall" quietTitle onClose={() => onClose('soundboard')}>
          <Flat>{soundboard}</Flat>
        </Sheet>
      )}
      {toggles.mic && (
        <Sheet title="Mikrofon" quietTitle onClose={() => onClose('mic')}>
          <Flat>{mic}</Flat>
        </Sheet>
      )}
      {toggles.camera && (
        <Sheet title="Kamera" quietTitle onClose={() => onClose('camera')}>
          <Flat>{camera}</Flat>
        </Sheet>
      )}
      {toggles.leave && (
        <Sheet title="Keluar dari meeting?" onClose={() => onClose('leave')}>
          <Flat>{leave}</Flat>
        </Sheet>
      )}
      {toggles.more && (
        <MoreSheet actions={actions} onClose={() => onClose('more')}>
          <Flat>{settings}</Flat>
        </MoreSheet>
      )}
    </>
  )
}
