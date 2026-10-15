import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import ui from './ui.module.css'
import styles from './Modal.module.css'

interface ModalProps {
  title: string
  onClose: () => void
  width?: number
  children: ReactNode
  footer?: ReactNode
}

/**
 * A native modal <dialog>: focus is trapped, Esc and a backdrop click close it. Focus goes back
 * to whatever opened it, which the browser does not do for a dialog removed from the DOM.
 */
export function Modal({ title, onClose, width = 640, children, footer }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const opener = document.activeElement
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    // React's autoFocus runs before the dialog is open, so showModal() would land on the close button
    dialog?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus()
    }
  }, [])

  return (
    <dialog
      ref={ref}
      className={`glass-3 ${styles.modal}`}
      style={{ '--modal-w': `${width}px` } as CSSProperties}
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <header className={styles.head}>
        <h2 id="modal-title">{title}</h2>
        <button type="button" className={`${ui.btn} ${ui.icon}`} onClick={onClose} aria-label="Tutup">
          <X size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </header>
      <div className={styles.body}>{children}</div>
      {footer && <footer className={styles.foot}>{footer}</footer>}
    </dialog>
  )
}
