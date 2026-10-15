import { X } from 'lucide-react'
import { useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useDialog } from '../mobile/useDialog'
import { useSheetDrag } from '../mobile/useSheetDrag'
import { useKeyboardInset } from '../mobile/useViewport'
import ui from './ui.module.css'
import styles from './Modal.module.css'

interface ModalProps {
  title: string
  onClose: () => void
  width?: number
  /** On a phone: a bottom sheet that fits its content, or edge to edge for long forms */
  size?: 'sheet' | 'full'
  children: ReactNode
  footer?: ReactNode
}

/**
 * A native modal <dialog>: focus is trapped, Esc and a backdrop click close it. On a phone it becomes a bottom
 * sheet (or a full screen for long forms) that also closes by dragging the handle down.
 */
export function Modal({ title, onClose, width = 640, size = 'sheet', children, footer }: ModalProps) {
  const ref = useDialog()
  const dragTarget = useRef<HTMLDialogElement | null>(null)
  const drag = useSheetDrag(dragTarget, onClose)
  const keyboard = useKeyboardInset()

  return (
    <dialog
      ref={(el) => {
        ref.current = el
        dragTarget.current = el
      }}
      className={`glass-3 ${styles.modal}`}
      data-size={size}
      style={{ '--modal-w': `${width}px`, '--kb': `${keyboard}px` } as CSSProperties}
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <header className={styles.head} {...drag}>
        <i className={styles.handle} aria-hidden="true" />
        <div className={styles.title}>
          <h2 id="modal-title">{title}</h2>
          <button type="button" className={`${ui.btn} ${ui.icon}`} onClick={onClose} onPointerDown={(e) => e.stopPropagation()} aria-label="Tutup">
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </header>
      <div className={styles.body}>{children}</div>
      {footer && <footer className={styles.foot}>{footer}</footer>}
    </dialog>
  )
}
