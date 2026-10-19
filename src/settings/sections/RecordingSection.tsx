import { Clock, DoorOpen } from 'lucide-react'
import type { Preferences } from '../preferences'
import { SettingRow, Switch } from '../controls'
import styles from '../sections.module.css'

const ICON = { size: 18, strokeWidth: 1.75, 'aria-hidden': true } as const

/** The storage rules are fixed by the product, so they are stated, not offered as switches. */
export function RecordingSection({ prefs, onPrefs }: { prefs: Preferences; onPrefs: (patch: Partial<Preferences>) => void }) {
  return (
    <>
      <dl className={styles.rules} aria-label="Aturan penyimpanan rekaman">
        <div>
          <dt>
            <Clock {...ICON} />
            Disimpan 24 jam
          </dt>
          <dd>Hitungan dimulai saat rapat selesai atau tidak ada lagi orang di ruangan. Setelah itu file dihapus otomatis dan hanya catatannya yang tersisa 7 hari.</dd>
        </div>
        <div>
          <dt>
            <DoorOpen {...ICON} />
            Berhenti saat ruangan kosong
          </dt>
          <dd>Begitu orang terakhir keluar, rekaman berhenti sendiri. Rapat yang dimulai lagi setelahnya menjadi rekaman baru.</dd>
        </div>
      </dl>

      <SettingRow label="Ingatkan sebelum rekaman dihapus" description="Pengingat muncul saat sisa waktu rekaman kurang dari 3 jam.">
        <Switch id="settings-expiry" label="Ingatkan sebelum rekaman dihapus" checked={prefs.expiryReminder} onChange={(expiryReminder) => onPrefs({ expiryReminder })} />
      </SettingRow>
    </>
  )
}
