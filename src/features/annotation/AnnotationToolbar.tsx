import { Check, Crosshair, Eraser, Highlighter, Hourglass, Pen, Trash2, Undo2 } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import type { AnnotationColor } from '../../state/types'
import { useAnnotation } from './AnnotationContext'
import type { AnnotationMode } from './AnnotationContext'
import styles from './AnnotationToolbar.module.css'

const ICON = { size: 18, strokeWidth: 1.75, 'aria-hidden': true } as const

const TOOLS: readonly { mode: AnnotationMode; label: string; icon: ReactNode }[] = [
  { mode: 'pen', label: 'Pena', icon: <Pen {...ICON} /> },
  { mode: 'highlighter', label: 'Stabilo', icon: <Highlighter {...ICON} /> },
  { mode: 'laser', label: 'Laser', icon: <Crosshair {...ICON} /> },
  { mode: 'eraser', label: 'Penghapus', icon: <Eraser {...ICON} /> },
]

const COLORS: readonly { color: AnnotationColor; label: string }[] = [
  { color: 'rose', label: 'Merah muda' },
  { color: 'blue', label: 'Biru' },
  { color: 'violet', label: 'Ungu' },
  { color: 'amber', label: 'Kuning' },
]

/** Floating drawing tools over the shared screen: tools, ink colour, undo, clear, vanishing ink, done. */
export function AnnotationToolbar() {
  const { mode, color, vanish, canManage, setMode, setColor, setVanish, undo, clear, setAnnotating } = useAnnotation()
  const inkTools = mode !== 'eraser' && mode !== 'laser'

  return (
    <motion.div
      className={`glass-2 ${styles.bar}`}
      role="toolbar"
      aria-label="Alat coret layar"
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
    >
      <div className={styles.group} role="radiogroup" aria-label="Alat">
        {TOOLS.map((t) => (
          <button key={t.mode} type="button" role="radio" aria-checked={mode === t.mode} aria-label={t.label} title={t.label} onClick={() => setMode(t.mode)}>
            {t.icon}
          </button>
        ))}
      </div>

      <span className={styles.sep} aria-hidden="true" />

      <div className={styles.group} role="radiogroup" aria-label="Warna tinta" data-dim={!inkTools && mode === 'eraser'}>
        {COLORS.map((c) => (
          <button key={c.color} type="button" role="radio" className={styles.swatch} data-color={c.color} aria-checked={color === c.color} aria-label={c.label} title={c.label} onClick={() => setColor(c.color)} />
        ))}
      </div>

      <span className={styles.sep} aria-hidden="true" />

      <div className={styles.group}>
        <button type="button" aria-label="Urungkan coretan terakhir" title="Urungkan" onClick={undo}>
          <Undo2 {...ICON} />
        </button>
        <button type="button" aria-label={canManage ? 'Hapus semua coretan' : 'Hapus coretan saya'} title={canManage ? 'Hapus semua' : 'Hapus coretan saya'} onClick={clear}>
          <Trash2 {...ICON} />
        </button>
        <button type="button" aria-pressed={vanish} aria-label="Hilang otomatis" title="Hilang otomatis" onClick={() => setVanish(!vanish)}>
          <Hourglass {...ICON} />
        </button>
      </div>

      <span className={styles.sep} aria-hidden="true" />

      <button type="button" className={styles.done} onClick={() => setAnnotating(false)}>
        <Check size={16} strokeWidth={2} aria-hidden="true" />
        Selesai
      </button>
    </motion.div>
  )
}
