import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import type { CSSProperties } from 'react'
import { useDialog } from './useDialog'
import { useSheetDrag } from './useSheetDrag'
import { useKeyboardInset } from './useViewport'
import styles from './Sheet.module.css'

export type SheetSize = 'auto' | 'tall' | 'full'

interface SheetProps {
  title: string
  onClose: () => void
  /** auto: fits its content; tall: up to 92% of the screen; full: edge to edge */
  size?: SheetSize
  children: ReactNode
  footer?: ReactNode
  /** Hide the visible title (the dialog still has it as its accessible name) */
  quietTitle?: boolean
}

/**
 * A bottom sheet on a native modal <dialog>: focus is trapped, Esc and a backdrop tap close it, and dragging the
 * handle or header down closes it. On a wider screen the same sheet is a centered panel, so callers need no branch.
 */
export function Sheet({ title, onClose, size = 'auto', children, footer, quietTitle }: SheetProps) {
  const ref = useDialog()
  const drag = useSheetDrag(ref, onClose)
  const keyboard = useKeyboardInset()
  const titleId = 'sheet-title'

  return (
    <dialog
      ref={ref}
      className={`glass-3 ${styles.sheet}`}
      data-size={size}
      style={{ '--kb': `${keyboard}px` } as CSSProperties}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <header className={styles.grab} {...drag}>
        <i className={styles.handle} aria-hidden="true" />
        <div className={styles.head}>
          <h2 id={titleId} className={quietTitle ? 'sr-only' : undefined}>
            {title}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} onPointerDown={(e) => e.stopPropagation()} aria-label="Tutup">
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </header>
      <div className={styles.body}>{children}</div>
      {footer && <footer className={styles.foot}>{footer}</footer>}
    </dialog>
  )
}
