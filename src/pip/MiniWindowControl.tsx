import { PictureInPicture2 } from 'lucide-react'
import { useState } from 'react'
import { loadPreferences, savePreferences } from '../settings/preferences'
import styles from './MiniWindowControl.module.css'

interface MiniWindowControlProps {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

/** "Mini window" section of the Lainnya popover: open or close it by hand, and choose whether sharing opens it. */
export function MiniWindowControl({ isOpen, onOpen, onClose }: MiniWindowControlProps) {
  const [auto, setAuto] = useState(() => loadPreferences().autoMiniWindow)
  const toggleAuto = () => {
    const next = !auto
    setAuto(next)
    savePreferences({ autoMiniWindow: next })
  }

  return (
    <section aria-label="Mini window" className={styles.section}>
      <h2>Mini window</h2>
      <button type="button" className={styles.open} onClick={isOpen ? onClose : onOpen}>
        <PictureInPicture2 size={18} strokeWidth={1.75} aria-hidden="true" />
        {isOpen ? 'Tutup mini window' : 'Buka mini window'}
      </button>
      <label className={styles.auto}>
        <span>Buka otomatis saat berbagi layar</span>
        <input type="checkbox" checked={auto} onChange={toggleAuto} />
      </label>
      <p className={styles.hint}>Tetap di atas semua jendela, jadi kontrol meeting tetap ada saat kamu pindah tab atau aplikasi.</p>
    </section>
  )
}
