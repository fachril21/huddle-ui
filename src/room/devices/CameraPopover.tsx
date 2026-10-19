import { SwitchCamera } from 'lucide-react'
import { motion } from 'motion/react'
import { CAMERA_QUALITIES, qualityOption } from '../cameraQuality'
import type { CameraQuality } from '../cameraQuality'
import { useMediaPreview } from '../../prejoin/useMediaPreview'
import type { PaletteName } from '../../state/types'
import { CameraPreview } from './CameraPreview'
import { DeviceField, DeviceIssue } from './DeviceField'
import type { DeviceSettings } from './deviceSettings'
import { useDeviceFallback } from './useDeviceFallback'
import styles from './DevicePopover.module.css'

interface CameraPopoverProps {
  quality: CameraQuality
  camOn: boolean
  palette: PaletteName
  devices: DeviceSettings
  /** Own connection is poor or reconnecting */
  weakConnection: boolean
  /** Phones get a front/back switch */
  phone: boolean
  onQuality: (quality: CameraQuality) => void
  onDevice: (id: string) => void
  onFlip: () => void
  onTurnOn: () => void
}

/**
 * Camera settings next to the camera button: a live picture, which camera to use, and how sharp (and how heavy)
 * the outgoing video is. The picture only runs while the camera is on in the meeting.
 */
export function CameraPopover({ quality, camOn, palette, devices, weakConnection, phone, onQuality, onDevice, onFlip, onTurnOn }: CameraPopoverProps) {
  const media = useMediaPreview({ camOn, micOn: false, quality, cameraId: devices.cameraId, micId: '', facing: devices.facing })
  const { cameras } = media.devices
  useDeviceFallback(devices.cameraId, cameras, () => onDevice(''))
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
      <section className={styles.group} aria-labelledby="cam-device-title">
        <h2 id="cam-device-title">Kamera</h2>
        <CameraPreview stream={media.videoStream} camOn={camOn} status={media.cameraStatus} palette={palette} mirrored={devices.facing === 'user' || devices.cameraId !== ''} onTurnOn={onTurnOn} />
        <DeviceField label="Pilih kamera" options={cameras} value={devices.cameraId} onChange={onDevice} />
        {phone && cameras.length > 1 && (
          <button type="button" className={styles.pill} data-quiet="true" data-self="start" onClick={onFlip}>
            <SwitchCamera size={16} strokeWidth={1.75} aria-hidden="true" />
            Balik kamera
          </button>
        )}
        {camOn && <DeviceIssue status={media.cameraStatus} onRetry={() => media.retry('camera')} />}
      </section>

      <section className={styles.group} aria-labelledby="cam-quality-title">
        <h3 id="cam-quality-title">Kualitas kirim</h3>
        <div className={styles.segment} role="group" aria-labelledby="cam-quality-title">
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
        {!camOn && <p className={styles.hint}>Berlaku saat kamera dinyalakan.</p>}
        {weakConnection && quality !== 'low' && (
          <div className={styles.callout} role="status">
            <span>Koneksi Anda sedang lemah. Kualitas Rendah mengurangi buffering di sisi peserta lain.</span>
            <button type="button" onClick={() => onQuality('low')}>
              Pakai Rendah
            </button>
          </div>
        )}
      </section>
    </motion.div>
  )
}
