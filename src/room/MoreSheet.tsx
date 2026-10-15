import type { ReactNode } from 'react'
import { Sheet } from '../mobile/Sheet'
import styles from './MoreSheet.module.css'

export interface MoreAction {
  readonly id: string
  readonly label: string
  readonly icon: ReactNode
  /** On/off actions such as raising a hand */
  readonly pressed?: boolean
  /** Why the action is unavailable right now; it stays tappable so the reason can be read */
  readonly unavailable?: string
  readonly badge?: number
  readonly onSelect: () => void
}

interface MoreSheetProps {
  actions: readonly MoreAction[]
  onClose: () => void
  /** Settings shown below the actions (effects tier, volumes) */
  children?: ReactNode
}

/** "Lainnya" on a phone: everything that is not on the control bar, as large labelled tiles. */
export function MoreSheet({ actions, onClose, children }: MoreSheetProps) {
  return (
    <Sheet title="Lainnya" size="tall" onClose={onClose}>
      <ul className={styles.grid}>
        {actions.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              className={styles.tile}
              aria-pressed={a.pressed}
              aria-disabled={a.unavailable ? true : undefined}
              aria-label={a.badge ? `${a.label}, ${a.badge}` : a.label}
              onClick={() => {
                // an unavailable action keeps the sheet open so its reason stays readable
                if (a.unavailable) return
                a.onSelect()
                onClose()
              }}
            >
              {a.icon}
              <span>{a.label}</span>
              {a.badge ? <b className={styles.badge}>{a.badge}</b> : null}
              {a.unavailable && <small>{a.unavailable}</small>}
            </button>
          </li>
        ))}
      </ul>
      {children && <div className={styles.settings}>{children}</div>}
    </Sheet>
  )
}
