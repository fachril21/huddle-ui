import { ChevronDown, LayoutGrid, PanelRight, PinOff, Presentation } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useViewport } from '../mobile/useViewport'
import type { LayoutMode, LayoutSettings } from '../state/types'
import { shortcutKey } from './shortcuts'
import styles from './LayoutMenu.module.css'

interface LayoutMenuProps {
  settings: LayoutSettings
  /** Name of the pinned person, when there is one in the room */
  pinnedName: string | null
  /** A screen share is on, so the chosen layout waits until it ends */
  sharing: boolean
  open: boolean
  onToggle: () => void
  onClose: () => void
  onMode: (mode: LayoutMode) => void
  onHideNoVideo: (on: boolean) => void
  onUnpin: () => void
}

interface ModeOption {
  readonly mode: LayoutMode
  readonly label: string
  readonly hint: string
  readonly icon: ReactNode
  readonly sketch: ReactNode
}

const ICON = { size: 16, strokeWidth: 1.75, 'aria-hidden': true } as const

/** Tiny schematic of each layout, drawn with currentColor so it follows the active state. */
const SKETCH = { width: 44, height: 28, viewBox: '0 0 44 28', 'aria-hidden': true } as const

const MODES: readonly ModeOption[] = [
  {
    mode: 'gallery',
    label: 'Galeri',
    hint: 'Semua orang sama besar',
    icon: <LayoutGrid {...ICON} />,
    sketch: (
      <svg {...SKETCH}>
        {[0, 1, 2].map((c) => [0, 1].map((r) => <rect key={`${c}${r}`} x={2 + c * 14} y={2 + r * 13} width="12" height="11" rx="2" />))}
      </svg>
    ),
  },
  {
    mode: 'speaker',
    label: 'Pembicara',
    hint: 'Yang bicara tampil besar',
    icon: <Presentation {...ICON} />,
    sketch: (
      <svg {...SKETCH}>
        <rect x="9" y="2" width="26" height="16" rx="2" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={3 + i * 10} y="21" width="8" height="5" rx="1.5" />
        ))}
      </svg>
    ),
  },
  {
    mode: 'spotlight',
    label: 'Sorotan',
    hint: 'Pin satu orang di layar besar',
    icon: <PanelRight {...ICON} />,
    sketch: (
      <svg {...SKETCH}>
        <rect x="2" y="2" width="28" height="24" rx="2" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x="33" y={2 + i * 8.5} width="9" height="7" rx="1.5" />
        ))}
      </svg>
    ),
  },
]

interface LayoutOptionsProps {
  settings: LayoutSettings
  pinnedName: string | null
  sharing: boolean
  onMode: (mode: LayoutMode) => void
  onHideNoVideo: (on: boolean) => void
  onUnpin: () => void
  /** The sheet already has the title; the popover needs its own */
  showTitle?: boolean
}

/** The choices inside the layout menu. Shown in the top-bar popover, or in a bottom sheet on a phone. */
export function LayoutOptions({ settings, pinnedName, sharing, onMode, onHideNoVideo, onUnpin, showTitle = true }: LayoutOptionsProps) {
  const { coarse } = useViewport()
  return (
    <>
    {showTitle && <h2>Tampilan layar</h2>}
    <div className={styles.modes} role="radiogroup" aria-label="Mode tampilan">
      {MODES.map((m) => (
        <button key={m.mode} type="button" role="radio" aria-checked={settings.mode === m.mode} onClick={() => onMode(m.mode)}>
          {m.sketch}
          <span className={styles.label}>{m.label}</span>
          <span className={styles.hint}>{m.hint}</span>
        </button>
      ))}
    </div>

    {settings.mode === 'spotlight' && (
      <p className={styles.note}>
        {pinnedName ? (
          <>
            Disorot: <b>{pinnedName}</b>
            <button type="button" onClick={onUnpin}>
              <PinOff size={13} strokeWidth={1.75} aria-hidden="true" />
              Lepas
            </button>
          </>
        ) : (
          coarse ? 'Ketuk ikon pin di kartu peserta. Tanpa pin, yang sedang bicara yang disorot.' : 'Arahkan ke kartu peserta lalu klik ikon pin. Tanpa pin, yang sedang bicara yang disorot.'
        )}
      </p>
    )}

    <button type="button" role="switch" aria-checked={settings.hideNoVideo} className={styles.switch} onClick={() => onHideNoVideo(!settings.hideNoVideo)}>
      <span>Sembunyikan peserta tanpa kamera</span>
      <i aria-hidden="true" />
    </button>

    {sharing && <p className={styles.note}>Layar sedang dibagikan. Tampilan ini dipakai lagi setelah berbagi layar selesai.</p>}
    </>
  )
}

/** "Tampilan" menu in the top bar: gallery / speaker / spotlight, plus hiding people without video. */
export function LayoutMenu({ settings, pinnedName, sharing, open, onToggle, onClose, onMode, onHideNoVideo, onUnpin }: LayoutMenuProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const current = MODES.find((m) => m.mode === settings.mode) ?? MODES[0]

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      onClose()
      wrapRef.current?.querySelector<HTMLElement>('[data-layout-trigger]')?.focus()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button
        type="button"
        data-layout-trigger
        className={`glass-1 ${styles.trigger}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-keyshortcuts={shortcutKey('layout')}
        onClick={onToggle}
      >
        {current.icon}
        <span>{current.label}</span>
        <ChevronDown {...ICON} className={styles.chevron} />
        <span role="tooltip" className={`glass-1 ${styles.tip}`}>
          Tampilan layar
          <kbd className="keycap">{shortcutKey('layout')}</kbd>
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={`glass-2 ${styles.popover}`}
            role="dialog"
            aria-label="Tampilan layar"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <LayoutOptions settings={settings} pinnedName={pinnedName} sharing={sharing} onMode={onMode} onHideNoVideo={onHideNoVideo} onUnpin={onUnpin} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
