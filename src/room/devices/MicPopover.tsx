import { motion } from 'motion/react'
import { useState } from 'react'
import { useMediaPreview } from '../../prejoin/useMediaPreview'
import { useMicLevel } from '../../prejoin/useMicLevel'
import { DEFAULT_CAMERA_QUALITY } from '../cameraQuality'
import type { DeviceSettings } from './deviceSettings'
import { MicSettingsBody } from './MicSettingsBody'
import { useDeviceFallback } from './useDeviceFallback'
import styles from './DevicePopover.module.css'

interface MicPopoverProps {
  micOn: boolean
  devices: DeviceSettings
  onMicDevice: (id: string) => void
  onSpeakerDevice: (id: string) => void
  onTurnOn: () => void
}

/**
 * Microphone settings next to the mic button: which mic and speaker to use, with a live level so a switch can be
 * checked on the spot. The mic is only opened while it is on in the meeting; nothing here is sent to anyone.
 */
export function MicPopover({ micOn, devices, onMicDevice, onSpeakerDevice, onTurnOn }: MicPopoverProps) {
  const media = useMediaPreview({ camOn: false, micOn, quality: DEFAULT_CAMERA_QUALITY, cameraId: '', micId: devices.micId })
  const level = useMicLevel(media.audioStream)
  const { mics, speakers } = media.devices
  const [speakerHeard, setSpeakerHeard] = useState(false)
  useDeviceFallback(devices.micId, mics, () => onMicDevice(''))
  useDeviceFallback(devices.speakerId, speakers, () => onSpeakerDevice(''))

  return (
    <motion.div
      className={`glass-2 ${styles.popover}`}
      role="dialog"
      aria-label="Pengaturan mikrofon"
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97, transition: { duration: 0.12 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
    >
      <MicSettingsBody
        micOn={micOn}
        micId={devices.micId}
        speakerId={devices.speakerId}
        mics={mics}
        speakers={speakers}
        micStatus={media.micStatus}
        level={level}
        speakerHeard={speakerHeard}
        onSpeakerHeard={setSpeakerHeard}
        onMicDevice={onMicDevice}
        onSpeakerDevice={onSpeakerDevice}
        onRetry={() => media.retry('mic')}
        onTurnOn={onTurnOn}
      />
    </motion.div>
  )
}
