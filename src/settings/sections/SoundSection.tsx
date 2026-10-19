import { useState } from 'react'
import { getGroupVolume, setGroupMuted, setGroupVolume } from '../../audio/audioEngine'
import type { Preferences } from '../preferences'
import { Slider, SettingRow, Switch } from '../controls'

const PERCENT = 100

/** Sounds the room makes on its own, and how loud the soundboard is. */
export function SoundSection({ prefs, onPrefs }: { prefs: Preferences; onPrefs: (patch: Partial<Preferences>) => void }) {
  const [volume, setVolume] = useState(() => Math.round(getGroupVolume('soundboard') * PERCENT))

  const toggleNotify = (notifySounds: boolean) => {
    setGroupMuted('notify', !notifySounds)
    onPrefs({ notifySounds })
  }

  return (
    <>
      <SettingRow label="Bunyi notifikasi" description="Bunyi singkat saat ada yang masuk, keluar, atau mengirim pesan.">
        <Switch label="Bunyi notifikasi" checked={prefs.notifySounds} onChange={toggleNotify} />
      </SettingRow>
      <SettingRow label="Volume soundboard" description="Seberapa keras suara soundboard terdengar di perangkat Anda." htmlFor="settings-volume" wide>
        <Slider
          id="settings-volume"
          label="Volume soundboard"
          value={volume}
          onChange={(next) => {
            setVolume(next)
            setGroupVolume('soundboard', next / PERCENT)
          }}
        />
      </SettingRow>
    </>
  )
}
