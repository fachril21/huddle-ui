import { useEffect, useId, useState } from 'react'
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
  /** Key cap text shown in the tooltip (e.g. "M") */
  shortcut?: string
  onClick?: () => void
}

const REVEAL_MS = 2600

export function DockButton({ icon, label, pressed, tone = 'default', disabledReason, wide, shortcut, onClick }: DockButtonProps) {
  const tipId = useId()
  const disabled = disabledReason !== undefined
  // a finger cannot hover: tapping a disabled button shows its reason for a moment instead
  const [reveal, setReveal] = useState(false)
  useEffect(() => {
    if (!reveal) return
    const id = window.setTimeout(() => setReveal(false), REVEAL_MS)
    return () => window.clearTimeout(id)
  }, [reveal])

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
      aria-keyshortcuts={shortcut}
      data-reveal={reveal || undefined}
      onClick={disabled ? () => setReveal(true) : onClick}
    >
      {icon}
      <span role="tooltip" id={tipId} className={`glass-1 ${styles.tip}`}>
        <span className={styles.tipRow}>
          {label}
          {shortcut && <kbd className="keycap">{shortcut}</kbd>}
        </span>
        {disabled && <span className={styles.reason}>{disabledReason}</span>}
      </span>
    </button>
  )
}
