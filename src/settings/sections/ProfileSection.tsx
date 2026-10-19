import { useState } from 'react'
import { MAX_NAME_LENGTH, isValidName, loadName, normalizeName, saveName } from '../../prejoin/displayName'
import { paletteFor } from '../../dashboard/people'
import ui from '../../dashboard/ui.module.css'
import { SettingRow } from '../controls'
import styles from '../sections.module.css'

/** The name other people see. The lobby starts from it; it can still be changed there for one meeting. */
export function ProfileSection({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState(loadName)
  const [touched, setTouched] = useState(false)
  const valid = isValidName(name)
  const shown = normalizeName(name) || 'Anda'

  const commit = () => {
    setTouched(true)
    if (!valid) return
    const next = normalizeName(name)
    if (next === loadName()) return
    setName(next)
    saveName(next)
    onSaved()
  }

  return (
    <>
      <div className={styles.identity}>
        <span className={styles.avatar} data-palette={paletteFor(shown)} aria-hidden="true">
          {shown.charAt(0).toUpperCase()}
        </span>
        <div>
          <p className={styles.identityName}>{shown}</p>
          <p className={styles.identityNote}>Begini nama Anda tampil di tile peserta.</p>
        </div>
      </div>
      <SettingRow label="Nama tampilan" description="Dipakai di lobby dan di dalam rapat." htmlFor="settings-name" wide>
        <div className={styles.field}>
          <input
            id="settings-name"
            className={ui.input}
            value={name}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="name"
            aria-invalid={touched && !valid}
            aria-describedby={touched && !valid ? 'settings-name-error' : undefined}
            onChange={(e) => setName(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
          />
          {touched && !valid && (
            <p id="settings-name-error" className={ui.error}>
              Nama tidak boleh kosong. Tulis nama yang ingin dilihat peserta lain.
            </p>
          )}
        </div>
      </SettingRow>
    </>
  )
}
