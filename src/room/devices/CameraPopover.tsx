import { motion } from 'motion/react'
import type { BackgroundChoice } from '../../background/backgrounds'
import { useBackground } from '../../background/useBackground'
import type { CameraQuality } from '../cameraQuality'
import { useMediaPreview } from '../../prejoin/useMediaPreview'
import type { PaletteName } from '../../state/types'
import { CameraPreview } from './CameraPreview'
import { CameraSettingsBody } from './CameraSettingsBody'
import type { DeviceSettings } from './deviceSettings'
import { useDeviceFallback } from './useDeviceFallback'
import styles from './DevicePopover.module.css'

interface CameraPopoverProps {
  quality: CameraQuality
  camOn: boolean
  palette: PaletteName
  devices: DeviceSettings
  background: BackgroundChoice
  /** Own connection is poor or reconnecting */
  weakConnection: boolean
  /** Phones get a front/back switch */
  phone: boolean
  onQuality: (quality: CameraQuality) => void
  onDevice: (id: string) => void
  onBackground: (background: BackgroundChoice) => void
  onFlip: () => void
  onTurnOn: () => void
}

/**
 * Camera settings next to the camera button: a live picture, which camera to use, and how sharp (and how heavy)
 * the outgoing video is. The picture only runs while the camera is on in the meeting.
 */
export function CameraPopover({ quality, camOn, palette, devices, background, weakConnection, phone, onQuality, onDevice, onBackground, onFlip, onTurnOn }: CameraPopoverProps) {
  const media = useMediaPreview({ camOn, micOn: false, quality, cameraId: devices.cameraId, micId: '', facing: devices.facing })
  const backdrop = useBackground(media.videoStream, background)
  const { cameras } = media.devices
  useDeviceFallback(devices.cameraId, cameras, () => onDevice(''))

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
      <CameraSettingsBody
        cameraId={devices.cameraId}
        cameras={cameras}
        cameraStatus={media.cameraStatus}
        camOn={camOn}
        quality={quality}
        background={background}
        backdrop={backdrop}
        weakConnection={weakConnection}
        phone={phone}
        preview={<CameraPreview stream={backdrop.stream} camOn={camOn} status={media.cameraStatus} palette={palette} mirrored={devices.facing === 'user' || devices.cameraId !== ''} onTurnOn={onTurnOn} />}
        onDevice={onDevice}
        onQuality={onQuality}
        onBackground={onBackground}
        onFlip={onFlip}
        onRetry={() => media.retry('camera')}
      />
    </motion.div>
  )
}
