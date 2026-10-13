import { useId } from 'react'
import type { ReactNode } from 'react'
import styles from './DockButton.module.css'

interface DockButtonProps {
  icon: ReactNode
  /** Accessible name and tooltip text */
  label: string
  /** For toggles whose label stays the same; omit when the label itself flips (mic, camera) */
  pressed?: boolean
  tone?: 'default' | 'off' | 'danger'
  /** When set the button is visually disabled but stays focusable so the reason can be read */
  disabledReason?: string
  wide?: boolean
  onClick?: () => void
}

export function DockButton({ icon, label, pressed, tone = 'default', disabledReason, wide, onClick }: DockButtonProps) {
  const tipId = useId()
  const disabled = disabledReason !== undefined

  return (
    <button
      type="button"
      className={styles.btn}
      data-tone={tone}
      data-wide={wide ? 'true' : undefined}
      aria-label={label}
      aria-pressed={pressed}
      aria-disabled={disabled || undefined}
      aria-describedby={disabled ? tipId : undefined}
      onClick={disabled ? undefined : onClick}
    >
      {icon}
      <span role="tooltip" id={tipId} className={`glass-1 ${styles.tip}`}>
        {label}
        {disabled && <span className={styles.reason}>{disabledReason}</span>}
      </span>
    </button>
  )
}
