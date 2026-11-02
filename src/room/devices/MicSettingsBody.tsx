import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { canPickSpeaker } from '../../prejoin/audioTests'
import { SpeakerTest } from '../../prejoin/DeviceTests'
import { MicMeter } from '../../prejoin/MicMeter'
import type { MediaStatus } from '../../prejoin/mediaState'
import type { DeviceOption } from '../../prejoin/useMediaPreview'
import type { MicLevel } from '../../prejoin/useMicLevel'
import { DeviceField, DeviceIssue } from './DeviceField'
import styles from './DevicePopover.module.css'

export interface MicSettingsBodyProps {
  micOn: boolean
  micId: string
  speakerId: string
  mics: readonly DeviceOption[]
  speakers: readonly DeviceOption[]
  micStatus: MediaStatus
  level: MicLevel
  speakerHeard: boolean
  onSpeakerHeard: (heard: boolean) => void
  onMicDevice: (id: string) => void
  onSpeakerDevice: (id: string) => void
  onRetry: () => void
  onTurnOn: () => void
  /** Extra tools under the meter (the lobby adds a record-and-play-back test) */
  extra?: ReactNode
}

/** The one line under the meter: what the mic is doing and what to try next. */
export function micLine(micOn: boolean, status: MediaStatus, heard: boolean): string {
  if (!micOn) return 'Mikrofon sedang mati. Nyalakan untuk mengetes.'
  if (status === 'requesting') return 'Membuka mikrofon…'
  if (status !== 'granted') return ''
  return heard ? 'Suara Anda terdengar. Mikrofon siap.' : 'Coba bicara. Bar mikrofon harus bergerak.'
}

/**
 * Which mic and speaker, with a live level so a switch can be checked on the spot. Shared by the room's mic menu and the
 * lobby's: the caller owns the media stream, this only draws it.
 */
export function MicSettingsBody({ micOn, micId, speakerId, mics, speakers, micStatus, level, speakerHeard, onSpeakerHeard, onMicDevice, onSpeakerDevice, onRetry, onTurnOn, extra }: MicSettingsBodyProps) {
  const pickSpeaker = canPickSpeaker() && speakers.length > 0
  const live = micOn && micStatus === 'granted'
  const line = micLine(micOn, micStatus, level.heardSignal)

  return (
    <>
      <section className={styles.group} aria-labelledby="mic-device-title">
        <h2 id="mic-device-title">Mikrofon</h2>
        <DeviceField label="Pilih mikrofon" options={mics} value={micId} onChange={onMicDevice} />
        <div className={styles.meterRow}>
          <MicMeter mic={level} active={live} />
        </div>
        <p className={styles.status} role="status" data-heard={live && level.heardSignal} hidden={!line}>
          {live && level.heardSignal && <Check size={14} strokeWidth={2} aria-hidden="true" />}
          {line}
        </p>
        {extra}
        {!micOn && (
          <button type="button" className={styles.pill} data-self="start" onClick={onTurnOn}>
            Nyalakan mikrofon
          </button>
        )}
        {micOn && <DeviceIssue status={micStatus} onRetry={onRetry} />}
      </section>

      <section className={styles.group} aria-labelledby="speaker-device-title">
        <h3 id="speaker-device-title">Speaker</h3>
        {pickSpeaker && (
          <DeviceField
            label="Pilih speaker"
            options={speakers}
            value={speakerId}
            onChange={(id) => {
              onSpeakerDevice(id)
              onSpeakerHeard(false)
            }}
          />
        )}
        <SpeakerTest speakerId={speakerId} confirmed={speakerHeard} onConfirm={onSpeakerHeard} />
      </section>
    </>
  )
}
