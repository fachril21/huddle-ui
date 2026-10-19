import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { canPickSpeaker } from '../../prejoin/audioTests'
import { SpeakerTest } from '../../prejoin/DeviceTests'
import { MicMeter } from '../../prejoin/MicMeter'
import type { MediaStatus } from '../../prejoin/mediaState'
import { useMediaPreview } from '../../prejoin/useMediaPreview'
import { useMicLevel } from '../../prejoin/useMicLevel'
import { DEFAULT_CAMERA_QUALITY } from '../cameraQuality'
import { DeviceField, DeviceIssue } from './DeviceField'
import type { DeviceSettings } from './deviceSettings'
import { useDeviceFallback } from './useDeviceFallback'
import styles from './DevicePopover.module.css'

interface MicPopoverProps {
  micOn: boolean
  devices: DeviceSettings
  onMicDevice: (id: string) => void
  onSpeakerDevice: (id: string) => void
  onTurnOn: () => void
}

/** The one line under the meter: what the mic is doing and what to try next. */
function micLine(micOn: boolean, status: MediaStatus, heard: boolean): string {
  if (!micOn) return 'Mikrofon mati di meeting. Nyalakan untuk mengetes.'
  if (status === 'requesting') return 'Membuka mikrofon…'
  if (status !== 'granted') return ''
  return heard ? 'Suara Anda terdengar. Mikrofon siap.' : 'Coba bicara. Bar mikrofon harus bergerak.'
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
  const pickSpeaker = canPickSpeaker() && speakers.length > 0
  useDeviceFallback(devices.micId, mics, () => onMicDevice(''))
  useDeviceFallback(devices.speakerId, speakers, () => onSpeakerDevice(''))

  const live = micOn && media.micStatus === 'granted'
  const line = micLine(micOn, media.micStatus, level.heardSignal)

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
      <section className={styles.group} aria-labelledby="mic-device-title">
        <h2 id="mic-device-title">Mikrofon</h2>
        <DeviceField label="Pilih mikrofon" options={mics} value={devices.micId} onChange={onMicDevice} />
        <div className={styles.meterRow}>
          <MicMeter mic={level} active={live} />
        </div>
        <p className={styles.status} role="status" data-heard={live && level.heardSignal} hidden={!line}>
          {live && level.heardSignal && <Check size={14} strokeWidth={2} aria-hidden="true" />}
          {line}
        </p>
        {!micOn && (
          <button type="button" className={styles.pill} data-self="start" onClick={onTurnOn}>
            Nyalakan mikrofon
          </button>
        )}
        {micOn && <DeviceIssue status={media.micStatus} onRetry={() => media.retry('mic')} />}
      </section>

      <section className={styles.group} aria-labelledby="speaker-device-title">
        <h3 id="speaker-device-title">Speaker</h3>
        {pickSpeaker && (
          <DeviceField
            label="Pilih speaker"
            options={speakers}
            value={devices.speakerId}
            onChange={(id) => {
              onSpeakerDevice(id)
              setSpeakerHeard(false)
            }}
          />
        )}
        <SpeakerTest speakerId={devices.speakerId} confirmed={speakerHeard} onConfirm={setSpeakerHeard} />
      </section>
    </motion.div>
  )
}
