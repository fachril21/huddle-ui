import { ChevronUp, Mic, MicOff, SwitchCamera, Video, VideoOff } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Flat } from '../mobile/Flat'
import { Sheet } from '../mobile/Sheet'
import { DockButton } from '../room/DockButton'
import popover from '../room/devices/DevicePopover.module.css'
import { PREJOIN_KEYS } from './prejoinShortcuts'
import type { MediaStatus } from './mediaState'
import styles from './StageControls.module.css'

const ICON = { size: 22, strokeWidth: 1.75, 'aria-hidden': true } as const

export type DevicePanel = 'mic' | 'camera'

const noop = () => undefined

const PANEL_LABEL: Record<DevicePanel, string> = { mic: 'Pengaturan mikrofon', camera: 'Pengaturan kamera' }

interface StageControlsProps {
  micOn: boolean
  camOn: boolean
  micStatus: MediaStatus
  cameraStatus: MediaStatus
  /** True once the mic has caught a voice */
  heard: boolean
  /** Which device menu is open, if any; the lobby owns this so its status line can open one too */
  open?: DevicePanel | null
  onOpenChange?: (panel: DevicePanel | null) => void
  /** Phones and tablets get the menus as a sheet; a desktop gets a popover above the dock */
  asSheet?: boolean
  /** Without the menus (the waiting room) the dock is just the two toggles */
  micPanel?: ReactNode
  cameraPanel?: ReactNode
  /** A device that needs attention marks its chevron, so the problem is visible without opening anything */
  micProblem?: boolean
  cameraProblem?: boolean
  onToggleMic: () => void
  onToggleCam: () => void
  /** Present only when the device has more than one camera */
  onFlipCamera?: () => void
}

/** What to tell the user to do next with their voice; empty when there's nothing to add. */
function micHint(micOn: boolean, status: MediaStatus, heard: boolean): string {
  if (!micOn) return 'Mikrofon mati. Nyalakan untuk mengetes.'
  if (status !== 'granted') return ''
  return heard ? 'Suaramu terdengar. Mikrofon siap.' : 'Coba bicara. Belum ada yang mendengar, ini hanya tes.'
}

/**
 * Floating glass dock over the preview, like Zoom's: mic and camera, each with a chevron that opens that device's menu
 * (which device, level, speaker test, background). Everything about devices lives here so the form beside it stays about joining.
 */
export function StageControls({ micOn, camOn, micStatus, cameraStatus, heard, open = null, onOpenChange = noop, asSheet = false, micPanel, cameraPanel, micProblem = false, cameraProblem = false, onToggleMic, onToggleCam, onFlipCamera }: StageControlsProps) {
  const micBlocked = micStatus === 'denied' || micStatus === 'no-device'
  const camBlocked = cameraStatus === 'denied' || cameraStatus === 'no-device'
  const hint = micHint(micOn, micStatus, heard)
  const wrapRef = useRef<HTMLDivElement>(null)
  const chevrons = useRef<Partial<Record<DevicePanel, HTMLButtonElement | null>>>({})
  const [anchor, setAnchor] = useState(0)
  const showFlip = Boolean(onFlipCamera && camOn)

  // the popover is centred on the chevron's group
  useLayoutEffect(() => {
    if (!open || asSheet || !wrapRef.current) return
    const group = wrapRef.current.querySelector<HTMLElement>(`[data-split="${open}"]`)
    if (!group) return
    const wrap = wrapRef.current.getBoundingClientRect()
    const rect = group.getBoundingClientRect()
    setAnchor(rect.left - wrap.left + rect.width / 2)
  }, [open, asSheet, showFlip])

  // Esc and a press outside close the popover; a sheet does both itself
  useEffect(() => {
    if (!open || asSheet) return
    const onDown = (e: PointerEvent) => {
      if (e.target instanceof Node && !wrapRef.current?.contains(e.target)) onOpenChange(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      onOpenChange(null)
      chevrons.current[open]?.focus()
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, asSheet, onOpenChange])

  const chevron = (panel: DevicePanel, problem: boolean) => (
    <button
      type="button"
      ref={(el) => {
        chevrons.current[panel] = el
      }}
      className={styles.chevron}
      aria-label={problem ? `${PANEL_LABEL[panel]}, perlu dicek` : PANEL_LABEL[panel]}
      aria-haspopup="dialog"
      aria-expanded={open === panel}
      data-alert={problem || undefined}
      onClick={() => onOpenChange(open === panel ? null : panel)}
    >
      <ChevronUp size={14} strokeWidth={2} aria-hidden="true" />
    </button>
  )

  const panels: Record<DevicePanel, ReactNode> = { mic: micPanel, camera: cameraPanel }

  return (
    <>
      <div className={styles.wrap} ref={wrapRef}>
        <div className={`glass-3 ${styles.dock}`} role="group" aria-label="Kontrol perangkat">
          <span className={styles.split} data-split="mic">
            <DockButton
              icon={micOn ? <Mic {...ICON} /> : <MicOff {...ICON} />}
              label={micOn ? 'Matikan mikrofon' : 'Nyalakan mikrofon'}
              tone={micOn ? 'default' : 'off'}
              shortcut={PREJOIN_KEYS.mic}
              disabledReason={micBlocked ? 'Mikrofon belum tersedia' : undefined}
              onClick={onToggleMic}
            />
            {micPanel !== undefined && chevron('mic', micProblem)}
          </span>
          <span className={styles.split} data-split="camera">
            <DockButton
              icon={camOn ? <Video {...ICON} /> : <VideoOff {...ICON} />}
              label={camOn ? 'Matikan kamera' : 'Nyalakan kamera'}
              tone={camOn ? 'default' : 'off'}
              shortcut={PREJOIN_KEYS.camera}
              disabledReason={camBlocked ? 'Kamera belum tersedia' : undefined}
              onClick={onToggleCam}
            />
            {cameraPanel !== undefined && chevron('camera', cameraProblem)}
          </span>
          {showFlip && onFlipCamera && <DockButton icon={<SwitchCamera {...ICON} />} label="Balik kamera" onClick={onFlipCamera} />}
        </div>
        <p className={`glass-1 ${styles.hint}`} role="status" data-heard={heard} hidden={!hint || open !== null}>
          {hint}
        </p>
        {!asSheet && (
          <div className={styles.slot} style={{ left: anchor }}>
            <AnimatePresence>
              {open && (
                <motion.div
                  key={open}
                  className={`glass-2 ${popover.popover}`}
                  role="dialog"
                  aria-label={PANEL_LABEL[open]}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97, transition: { duration: 0.12 } }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                >
                  {panels[open]}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
      {asSheet && open && (
        <Sheet title={open === 'mic' ? 'Mikrofon' : 'Kamera'} quietTitle onClose={() => onOpenChange(null)}>
          <Flat>
            <div className={popover.popover}>{panels[open]}</div>
          </Flat>
        </Sheet>
      )}
    </>
  )
}
