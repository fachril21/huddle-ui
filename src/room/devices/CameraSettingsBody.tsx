import { SwitchCamera } from 'lucide-react'
import type { ReactNode } from 'react'
import { BackgroundPicker } from '../../background/BackgroundPicker'
import type { BackgroundChoice } from '../../background/backgrounds'
import type { Background } from '../../background/useBackground'
import type { MediaStatus } from '../../prejoin/mediaState'
import type { DeviceOption } from '../../prejoin/useMediaPreview'
import { CAMERA_QUALITIES, qualityOption } from '../cameraQuality'
import type { CameraQuality } from '../cameraQuality'
import { DeviceField, DeviceIssue } from './DeviceField'
import styles from './DevicePopover.module.css'

export interface CameraSettingsBodyProps {
  cameraId: string
  cameras: readonly DeviceOption[]
  cameraStatus: MediaStatus
  camOn: boolean
  quality: CameraQuality
  background: BackgroundChoice
  backdrop: Background
  /** Own connection is poor or reconnecting */
  weakConnection: boolean
  /** Phones get a front/back switch */
  phone: boolean
  /** The room shows its own live picture here; the lobby already has the whole stage as one */
  preview?: ReactNode
  onDevice: (id: string) => void
  onQuality: (quality: CameraQuality) => void
  onBackground: (background: BackgroundChoice) => void
  onFlip: () => void
  onRetry: () => void
}

/**
 * Which camera, what sits behind you, and how sharp (and how heavy) the outgoing video is. Shared by the room's camera
 * menu and the lobby's: the caller owns the media stream, this only draws it.
 */
export function CameraSettingsBody({ cameraId, cameras, cameraStatus, camOn, quality, background, backdrop, weakConnection, phone, preview, onDevice, onQuality, onBackground, onFlip, onRetry }: CameraSettingsBodyProps) {
  const current = qualityOption(quality)

  return (
    <>
      <section className={styles.group} aria-labelledby="cam-device-title">
        <h2 id="cam-device-title">Kamera</h2>
        {preview}
        <DeviceField label="Pilih kamera" options={cameras} value={cameraId} onChange={onDevice} />
        {phone && cameras.length > 1 && (
          <button type="button" className={styles.pill} data-quiet="true" data-self="start" onClick={onFlip}>
            <SwitchCamera size={16} strokeWidth={1.75} aria-hidden="true" />
            Balik kamera
          </button>
        )}
        {camOn && <DeviceIssue status={cameraStatus} onRetry={onRetry} />}
      </section>

      <section className={styles.group} aria-labelledby="cam-background-title">
        <h3 id="cam-background-title">Latar</h3>
        <BackgroundPicker choice={background} onChange={onBackground} custom={backdrop.custom} status={backdrop.status} failure={backdrop.failure} camOn={camOn} />
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
    </>
  )
}
