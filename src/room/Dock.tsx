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
import { AnimatePresence } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { DockToggle, Participant, ReactionName, RoomState } from '../state/types'
import { DockButton } from './DockButton'
import { ReactionPicker } from './ReactionPicker'
import styles from './Dock.module.css'

interface DockProps {
  self: Participant
  toggles: RoomState['toggles']
  onToggleMic: () => void
  onToggleCam: () => void
  onToggleHand: () => void
  onToggle: (key: DockToggle) => void
  onClose: (key: DockToggle) => void
  onReact: (name: ReactionName) => void
  onHighFive: () => void
  /** Popover for the soundboard button (M6) */
  soundboard?: ReactNode
}

const ICON = { size: 22, strokeWidth: 1.75, 'aria-hidden': true } as const

/** Floating glass-3 capsule: [mic cam] | [share reaction hand high-five soundboard more] | [leave]. */
export function Dock({ self, toggles, onToggleMic, onToggleCam, onToggleHand, onToggle, onClose, onReact, onHighFive, soundboard }: DockProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const openPopover: DockToggle | null = toggles.reaction ? 'reaction' : toggles.soundboard ? 'soundboard' : null
  const anchorX = usePopoverAnchor(wrapRef, openPopover)

  // Esc or a click outside closes the open popover; focus returns to its trigger on Esc.
  useEffect(() => {
    if (!openPopover) return
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Element
      if (!wrapRef.current?.contains(t)) onClose(openPopover)
      // clicking the dock but not the trigger button also dismisses
      else if (!t.closest(`[data-popover-key="${openPopover}"]`) && !t.closest('[data-popover-surface]')) onClose(openPopover)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      onClose(openPopover)
      wrapRef.current?.querySelector<HTMLElement>(`[data-popover-key="${openPopover}"] button`)?.focus()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [openPopover, onClose])

  return (
    <div ref={wrapRef} className={styles.wrap}>
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
        <span data-popover-key="reaction" style={{ display: 'contents' }}>
          <DockButton icon={<SmilePlus {...ICON} />} label="Reaction" pressed={toggles.reaction} onClick={() => onToggle('reaction')} />
        </span>
        <DockButton icon={<Hand {...ICON} />} label="Angkat tangan" pressed={self.hand !== null} onClick={onToggleHand} />
        <DockButton icon={<Handshake {...ICON} />} label="High five" pressed={toggles.highFive} onClick={onHighFive} />
        <span data-popover-key="soundboard" style={{ display: 'contents' }}>
          <DockButton icon={<AudioLines {...ICON} />} label="Soundboard" pressed={toggles.soundboard} onClick={() => onToggle('soundboard')} />
        </span>
        <DockButton icon={<Ellipsis {...ICON} />} label="Lainnya" pressed={toggles.more} onClick={() => onToggle('more')} />
        <span className={styles.sep} aria-hidden="true" />
        <DockButton icon={<PhoneOff {...ICON} />} label="Keluar" tone="danger" wide />
      </nav>
      <div className={styles.popoverSlot} style={{ left: anchorX }} data-popover-surface>
        <AnimatePresence>
          {toggles.reaction && <ReactionPicker key="reaction" onReact={onReact} onHighFive={onHighFive} />}
          {toggles.soundboard && soundboard}
        </AnimatePresence>
      </div>
    </div>
  )
}

/** Horizontal center (px, relative to the dock wrapper) of the button that owns the open popover. */
function usePopoverAnchor(wrapRef: React.RefObject<HTMLDivElement | null>, key: DockToggle | null): number {
  const [x, setX] = useState(0)
  useLayoutEffect(() => {
    if (!key || !wrapRef.current) return
    const button = wrapRef.current.querySelector<HTMLElement>(`[data-popover-key="${key}"] button`)
    if (!button) return
    const wrap = wrapRef.current.getBoundingClientRect()
    const rect = button.getBoundingClientRect()
    setX(rect.left - wrap.left + rect.width / 2)
  }, [key, wrapRef])
  return x
}
