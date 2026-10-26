import { Ban, Check, Droplets, ImageIcon, ImagePlus, LoaderCircle, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useId, useRef } from 'react'
import type { ChangeEvent } from 'react'
import { BACKGROUND_IMAGES, BLUR_LEVELS, CUSTOM_BACKGROUND_ID, DEFAULT_BLUR_LEVEL, NO_BACKGROUND, describeBackground } from './backgrounds'
import type { BackgroundChoice, BlurLevel } from './backgrounds'
import { BackgroundThumb } from './BackgroundThumb'
import { UPLOAD_PROBLEM_COPY } from './uploadRules'
import type { EffectFailure, EffectStatus } from './useBackgroundEffect'
import type { CustomBackground } from './useCustomBackground'
import styles from './BackgroundPicker.module.css'

type Mode = BackgroundChoice['mode']

const MODES: readonly { id: Mode; label: string; Icon: LucideIcon }[] = [
  { id: 'none', label: 'Tanpa efek', Icon: Ban },
  { id: 'blur', label: 'Blur', Icon: Droplets },
  { id: 'image', label: 'Gambar', Icon: ImageIcon },
]

const FAILURE_COPY: Record<NonNullable<EffectFailure>, string> = {
  model: 'Efek latar belum bisa jalan di perangkat ini. Kamera tetap tampil apa adanya.',
  slow: 'Perangkat ini terlalu berat untuk efek latar, jadi efek dilewati. Coba kualitas kamera Rendah atau tutup aplikasi lain.',
  image: 'Gambar latar tidak bisa dimuat. Pilih gambar lain.',
}

interface BackgroundPickerProps {
  choice: BackgroundChoice
  onChange: (next: BackgroundChoice) => void
  custom: CustomBackground
  /** How the live effect is doing. Leave out where there is no camera picture (Pengaturan). */
  status?: EffectStatus
  failure?: EffectFailure
  /** Whether the camera is on in the meeting; leave out where that does not apply */
  camOn?: boolean
}

function StatusLine({ choice, status, failure, camOn, onTurnOff }: { choice: BackgroundChoice; status: EffectStatus; failure: EffectFailure; camOn?: boolean; onTurnOff: () => void }) {
  let body: React.ReactNode = null
  if (camOn === false && choice.mode !== 'none') body = 'Berlaku saat kamera dinyalakan.'
  else if (status === 'loading') {
    body = (
      <>
        <LoaderCircle size={14} strokeWidth={2} className={styles.spin} aria-hidden="true" />
        Menyiapkan efek…
      </>
    )
  } else if (status === 'error' && failure) {
    body = (
      <>
        <span>{FAILURE_COPY[failure]}</span>
        <button type="button" className={styles.linkButton} onClick={onTurnOff}>
          Matikan efek
        </button>
      </>
    )
  } else if (status === 'ready') {
    body = (
      <>
        <Check size={14} strokeWidth={2.25} aria-hidden="true" />
        Latar aktif: {describeBackground(choice)}
      </>
    )
  }
  return (
    <div className={styles.status} role="status" data-tone={status === 'error' ? 'warn' : undefined}>
      {body}
    </div>
  )
}

/**
 * Choose what sits behind you: nothing, a blurred room, or a picture (built in or your own).
 * Plain radio inputs underneath, so arrow keys, focus and screen readers work without extra code.
 */
export function BackgroundPicker({ choice, onChange, custom, status = 'off', failure = null, camOn }: BackgroundPickerProps) {
  const group = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const lastLevel = useRef<BlurLevel>(DEFAULT_BLUR_LEVEL)
  const lastImage = useRef<string | null>(null)
  if (choice.mode === 'blur') lastLevel.current = choice.level
  if (choice.mode === 'image') lastImage.current = choice.id

  const pickMode = (mode: Mode) => {
    if (mode === 'none') return onChange(NO_BACKGROUND)
    if (mode === 'blur') return onChange({ mode: 'blur', level: lastLevel.current })
    const remembered = lastImage.current
    const stillThere = remembered === CUSTOM_BACKGROUND_ID ? custom.url !== null : BACKGROUND_IMAGES.some((i) => i.id === remembered)
    onChange({ mode: 'image', id: remembered && stillThere ? remembered : (custom.url ? CUSTOM_BACKGROUND_ID : BACKGROUND_IMAGES[0].id) })
  }

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file && (await custom.upload(file))) onChange({ mode: 'image', id: CUSTOM_BACKGROUND_ID })
  }

  const removeCustom = async () => {
    await custom.remove()
    if (choice.mode === 'image' && choice.id === CUSTOM_BACKGROUND_ID) onChange(NO_BACKGROUND)
  }

  return (
    <div className={styles.picker}>
      <div className={styles.modes} role="radiogroup" aria-label="Jenis latar">
        {MODES.map(({ id, label, Icon }) => (
          <label key={id} className={styles.mode}>
            <input type="radio" name={`${group}-mode`} checked={choice.mode === id} onChange={() => pickMode(id)} />
            <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>{label}</span>
          </label>
        ))}
      </div>

      {choice.mode === 'blur' && (
        <div className={styles.levels} role="radiogroup" aria-label="Kekuatan blur">
          {BLUR_LEVELS.map((level) => (
            <label key={level.id} className={styles.level}>
              <input type="radio" name={`${group}-blur`} checked={choice.level === level.id} onChange={() => onChange({ mode: 'blur', level: level.id })} />
              <span>{level.label}</span>
            </label>
          ))}
        </div>
      )}

      {choice.mode === 'image' && (
        <>
          <div className={styles.grid} role="radiogroup" aria-label="Gambar latar">
            {custom.url && (
              <label className={styles.tile}>
                <input type="radio" name={`${group}-image`} checked={choice.id === CUSTOM_BACKGROUND_ID} onChange={() => onChange({ mode: 'image', id: CUSTOM_BACKGROUND_ID })} />
                <BackgroundThumb sources={[custom.url]} tint={['#2b3350', '#4a5a8a']} />
                <span className={styles.name}>Gambar saya</span>
                <Check size={14} strokeWidth={2.5} className={styles.tick} aria-hidden="true" />
              </label>
            )}
            {BACKGROUND_IMAGES.map((image) => (
              <label key={image.id} className={styles.tile}>
                <input type="radio" name={`${group}-image`} checked={choice.id === image.id} onChange={() => onChange({ mode: 'image', id: image.id })} />
                <BackgroundThumb sources={image.sources} tint={image.tint} />
                <span className={styles.name}>{image.label}</span>
                <Check size={14} strokeWidth={2.5} className={styles.tick} aria-hidden="true" />
              </label>
            ))}
          </div>

          <div className={styles.upload}>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className={styles.file} tabIndex={-1} aria-hidden="true" onChange={(e) => void onFile(e)} />
            <button type="button" className={styles.uploadButton} disabled={custom.busy} onClick={() => fileRef.current?.click()}>
              {custom.busy ? <LoaderCircle size={16} strokeWidth={1.75} className={styles.spin} aria-hidden="true" /> : <ImagePlus size={16} strokeWidth={1.75} aria-hidden="true" />}
              {custom.busy ? 'Memproses…' : custom.url ? 'Ganti gambar' : 'Unggah gambar'}
            </button>
            {custom.url && (
              <button type="button" className={styles.linkButton} onClick={() => void removeCustom()}>
                <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
                Hapus
              </button>
            )}
          </div>
          <p className={styles.hint}>JPG, PNG, atau WebP, maksimal 5 MB. Gambar disimpan di perangkat ini saja.</p>
          {custom.problem && (
            <p className={styles.error} role="alert">
              {UPLOAD_PROBLEM_COPY[custom.problem]}
            </p>
          )}
        </>
      )}

      <StatusLine choice={choice} status={status} failure={failure} camOn={camOn} onTurnOff={() => onChange(NO_BACKGROUND)} />
    </div>
  )
}
