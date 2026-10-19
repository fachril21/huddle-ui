import { useId } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import styles from './controls.module.css'

interface SettingRowProps {
  label: string
  description?: string
  /** The control sits to the right on wide screens, under the text on a phone */
  children: ReactNode
  /** Id of the control inside, so the label names it */
  htmlFor?: string
  /** The control is wide (a picker or a segmented row) and gets its own line on narrow screens */
  wide?: boolean
}

/** One setting: what it is and what it does on the left, the control on the right. */
export function SettingRow({ label, description, children, htmlFor, wide }: SettingRowProps) {
  return (
    <div className={styles.row} data-wide={wide || undefined}>
      <div className={styles.text}>
        {htmlFor ? (
          <label htmlFor={htmlFor} className={styles.label}>
            {label}
          </label>
        ) : (
          <span className={styles.label}>{label}</span>
        )}
        {description && <p className={styles.desc}>{description}</p>}
      </div>
      <div className={styles.control}>{children}</div>
    </div>
  )
}

interface SwitchProps {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  id?: string
}

/** On/off switch. The state is also written out ("Aktif"), so it never depends on position or color alone. */
export function Switch({ checked, onChange, label, id }: SwitchProps) {
  return (
    <button type="button" role="switch" id={id} aria-checked={checked} aria-label={label} className={styles.switch} onClick={() => onChange(!checked)}>
      <span className={styles.state} aria-hidden="true">
        {checked ? 'Aktif' : 'Mati'}
      </span>
      <i className={styles.track} aria-hidden="true">
        <i className={styles.knob} />
      </i>
    </button>
  )
}

interface SliderProps {
  id: string
  label: string
  /** 0 to 100 */
  value: number
  onChange: (next: number) => void
}

/** A 0 to 100 slider with its value written beside it. */
export function Slider({ id, label, value, onChange }: SliderProps) {
  return (
    <div className={styles.slider}>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        aria-label={label}
        aria-valuetext={`${value} persen`}
        style={{ '--filled': `${value}%` } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <output htmlFor={id}>{value}%</output>
    </div>
  )
}

interface SegmentedProps<T extends string> {
  value: T
  options: readonly { readonly id: T; readonly label: string }[]
  onChange: (next: T) => void
  label: string
}

/** A short set of exclusive choices, all visible at once. */
export function Segmented<T extends string>({ value, options, onChange, label }: SegmentedProps<T>) {
  const group = useId()
  return (
    <div className={styles.segmented} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} id={`${group}-${o.id}`} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
