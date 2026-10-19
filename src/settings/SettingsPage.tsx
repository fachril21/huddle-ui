import { ChevronLeft, ChevronRight, Clapperboard, Keyboard, Monitor, UserRound, Video, Volume2 } from 'lucide-react'
import { useState } from 'react'
import type { Dispatch, ReactNode } from 'react'
import { useViewport } from '../mobile/useViewport'
import type { CameraQuality } from '../room/cameraQuality'
import type { RoomAction } from '../state/actions'
import type { Settings } from '../state/types'
import { DevicesSection } from './sections/DevicesSection'
import { DisplaySection } from './sections/DisplaySection'
import { ProfileSection } from './sections/ProfileSection'
import { RecordingSection } from './sections/RecordingSection'
import { ShortcutsSection } from './sections/ShortcutsSection'
import { SoundSection } from './sections/SoundSection'
import { loadPreferences, savePreferences } from './preferences'
import type { Preferences } from './preferences'
import styles from './SettingsPage.module.css'

type SectionId = 'profile' | 'devices' | 'recording' | 'display' | 'sound' | 'shortcuts'

const ICON = { size: 18, strokeWidth: 1.75, 'aria-hidden': true } as const

const SECTIONS: readonly { id: SectionId; label: string; summary: string; icon: ReactNode }[] = [
  { id: 'profile', label: 'Profil', summary: 'Nama tampilan', icon: <UserRound {...ICON} /> },
  { id: 'devices', label: 'Perangkat', summary: 'Kamera, mikrofon, speaker', icon: <Video {...ICON} /> },
  { id: 'recording', label: 'Rekaman', summary: 'Aturan simpan 24 jam', icon: <Clapperboard {...ICON} /> },
  { id: 'display', label: 'Tampilan dan gerak', summary: 'Efek dan animasi', icon: <Monitor {...ICON} /> },
  { id: 'sound', label: 'Suara', summary: 'Notifikasi dan soundboard', icon: <Volume2 {...ICON} /> },
  { id: 'shortcuts', label: 'Pintasan', summary: 'Tombol keyboard di rapat', icon: <Keyboard {...ICON} /> },
]

interface SettingsPageProps {
  settings: Settings
  roomDispatch: Dispatch<RoomAction>
  /** Show a short confirmation */
  say: (message: string) => void
}

/** Pengaturan: one section at a time, saved the moment it changes. */
export function SettingsPage({ settings, roomDispatch, say }: SettingsPageProps) {
  const phone = useViewport().sizeClass === 'phone'
  const [section, setSection] = useState<SectionId | null>(null)
  const [prefs, setPrefs] = useState<Preferences>(loadPreferences)

  // wide screens always show a section; a phone starts at the list and goes in
  const current: SectionId | null = phone ? section : (section ?? 'profile')
  const saved = () => say('Tersimpan')

  const update = (patch: Partial<Preferences>) => {
    setPrefs(savePreferences(patch))
    saved()
  }

  const body = (id: SectionId): ReactNode => {
    switch (id) {
      case 'profile':
        return <ProfileSection onSaved={saved} />
      case 'devices':
        return (
          <DevicesSection
            prefs={prefs}
            quality={settings.cameraQuality}
            onPrefs={update}
            onQuality={(quality: CameraQuality) => {
              roomDispatch({ type: 'setCameraQuality', quality })
              saved()
            }}
          />
        )
      case 'recording':
        return <RecordingSection prefs={prefs} onPrefs={update} />
      case 'display':
        return (
          <DisplaySection
            fx={settings.fx}
            reducedMotion={settings.simulateReduced}
            onFx={(fx) => {
              roomDispatch({ type: 'setFx', fx })
              setPrefs(savePreferences({ fx }))
              saved()
            }}
            onReducedMotion={(on) => {
              roomDispatch({ type: 'setSimulateReduced', on })
              saved()
            }}
          />
        )
      case 'sound':
        return <SoundSection prefs={prefs} onPrefs={update} />
      case 'shortcuts':
        return <ShortcutsSection />
    }
  }

  const active = SECTIONS.find((s) => s.id === current)

  if (phone && !active) {
    return (
      <>
        <header className={styles.head}>
          <h1>Pengaturan</h1>
        </header>
        <ul className={styles.menu}>
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => setSection(s.id)}>
                <span className={styles.menuIcon}>{s.icon}</span>
                <span className={styles.menuText}>
                  <span>{s.label}</span>
                  <span>{s.summary}</span>
                </span>
                <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </>
    )
  }

  return (
    <>
      <header className={styles.head}>
        <h1>Pengaturan</h1>
      </header>
      <div className={styles.layout}>
        {!phone && (
          <nav className={styles.nav} aria-label="Bagian pengaturan">
            <ul>
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <button type="button" aria-current={s.id === current ? 'page' : undefined} onClick={() => setSection(s.id)}>
                    {s.icon}
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <section className={styles.content} aria-labelledby="settings-section-title">
          {phone && (
            <button type="button" className={styles.back} onClick={() => setSection(null)}>
              <ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" />
              Pengaturan
            </button>
          )}
          <h2 id="settings-section-title" key={current}>
            {active?.label}
          </h2>
          {current && body(current)}
        </section>
      </div>
    </>
  )
}
