import { motion } from 'motion/react'
import { CAMERA_QUALITIES, qualityOption } from './cameraQuality'
import type { CameraQuality } from './cameraQuality'
import styles from './CameraPopover.module.css'

interface CameraPopoverProps {
  quality: CameraQuality
  camOn: boolean
  /** Own connection is poor or reconnecting */
  weakConnection: boolean
  onQuality: (quality: CameraQuality) => void
}

/** Camera menu next to the camera button: picks how sharp (and how heavy) the outgoing video is. */
export function CameraPopover({ quality, camOn, weakConnection, onQuality }: CameraPopoverProps) {
  const current = qualityOption(quality)
  return (
    <motion.div
      className={`glass-2 ${styles.popover}`}
      role="dialog"
      aria-label="Pengaturan kamera"
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97, transition: { duration: 0.12 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
    >
      <h2>Kualitas kamera</h2>
      <div className={styles.segment} role="group" aria-label="Kualitas kamera">
        {CAMERA_QUALITIES.map((q) => (
          <button key={q.id} type="button" aria-pressed={quality === q.id} onClick={() => onQuality(q.id)}>
            <span>{q.label}</span>
            <small>{q.resolution}</small>
          </button>
        ))}
      </div>
      <p className={styles.spec}>
        {current.resolution} · {current.fps} fps · {current.bitrate}
      </p>
      <p className={styles.hint}>{current.hint}</p>

      {weakConnection && quality !== 'low' && (
        <div className={styles.callout} role="status">
          <span>Koneksi Anda sedang lemah. Kualitas Rendah mengurangi buffering di sisi peserta lain.</span>
          <button type="button" onClick={() => onQuality('low')}>
            Pakai Rendah
          </button>
        </div>
      )}
      {!camOn && <p className={styles.hint}>Kamera Anda mati. Pilihan ini berlaku saat kamera dinyalakan.</p>}
    </motion.div>
  )
}
