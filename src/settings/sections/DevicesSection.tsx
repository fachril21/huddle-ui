import { CAMERA_QUALITIES } from '../../room/cameraQuality'
import type { CameraQuality } from '../../room/cameraQuality'
import { DeviceField } from '../../room/devices/DeviceField'
import ui from '../../dashboard/ui.module.css'
import type { Preferences } from '../preferences'
import { SettingRow, Segmented } from '../controls'
import { useDeviceList } from '../useDeviceList'
import styles from '../sections.module.css'

interface DevicesSectionProps {
  prefs: Preferences
  quality: CameraQuality
  onPrefs: (patch: Partial<Preferences>) => void
  onQuality: (quality: CameraQuality) => void
}

const SPEAKER_PICK = typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype

/** The devices the lobby starts on. They can still be changed for a single meeting. */
export function DevicesSection({ prefs, quality, onPrefs, onQuality }: DevicesSectionProps) {
  const { devices, namesHidden, blocked, reveal } = useDeviceList()
  const nothing = devices.cameras.length === 0 && devices.mics.length === 0
  const hint = CAMERA_QUALITIES.find((q) => q.id === quality)

  return (
    <>
      <p className={styles.lead}>Pilihan di sini dipakai sebagai awal saat Anda masuk lobby. Perangkat yang dicabut otomatis kembali ke bawaan sistem.</p>

      {namesHidden && (
        <div className={styles.notice} role="status">
          <p>
            <strong>Nama perangkat belum terlihat.</strong> Browser baru menampilkannya setelah Anda mengizinkan kamera dan mikrofon.
          </p>
          <button type="button" className={`${ui.btn} ${ui.small}`} onClick={() => void reveal()}>
            Izinkan dan tampilkan
          </button>
        </div>
      )}
      {blocked && (
        <p className={ui.error} role="alert">
          Izin ditolak, jadi nama perangkat tetap tersembunyi. Ubah izin kamera dan mikrofon di pengaturan browser, lalu coba lagi.
        </p>
      )}
      {nothing && !namesHidden && <p className={styles.lead}>Tidak ada kamera atau mikrofon yang terdeteksi. Anda tetap bisa masuk rapat tanpa keduanya.</p>}

      <SettingRow label="Kamera" description="Dipakai untuk video Anda." htmlFor="settings-camera" wide>
        <DeviceField id="settings-camera" label="Kamera" options={devices.cameras} value={prefs.cameraId} onChange={(cameraId) => onPrefs({ cameraId })} />
      </SettingRow>
      <SettingRow label="Mikrofon" description="Dipakai untuk suara Anda." htmlFor="settings-mic" wide>
        <DeviceField id="settings-mic" label="Mikrofon" options={devices.mics} value={prefs.micId} onChange={(micId) => onPrefs({ micId })} />
      </SettingRow>
      {SPEAKER_PICK ? (
        <SettingRow label="Speaker" description="Tempat suara peserta lain terdengar." htmlFor="settings-speaker" wide>
          <DeviceField id="settings-speaker" label="Speaker" options={devices.speakers} value={prefs.speakerId} onChange={(speakerId) => onPrefs({ speakerId })} />
        </SettingRow>
      ) : (
        <SettingRow label="Speaker" description="Browser ini memakai speaker bawaan sistem dan tidak bisa menggantinya dari sini.">
          <span className={styles.static}>Bawaan sistem</span>
        </SettingRow>
      )}
      <SettingRow label="Kualitas kamera" description={hint ? `${hint.resolution} · ${hint.fps} fps · ${hint.bitrate}. ${hint.hint}` : undefined} wide>
        <Segmented
          label="Kualitas kamera"
          value={quality}
          options={CAMERA_QUALITIES.map((q) => ({ id: q.id, label: q.label }))}
          onChange={onQuality}
        />
      </SettingRow>
    </>
  )
}
