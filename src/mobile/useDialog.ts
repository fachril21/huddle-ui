import { useEffect, useRef } from 'react'

/**
 * Opens a native <dialog> as modal on mount and gives focus back to the opener on unmount. React's autoFocus runs
 * before the dialog is open, so the element to focus first is marked with data-autofocus instead.
 */
export function useDialog() {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const opener = document.activeElement
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    const first = dialog?.querySelector<HTMLElement>('[data-autofocus]')
    if (first) first.focus()
    else if (dialog && window.matchMedia('(pointer: coarse)').matches) {
      // on a touch screen a focus ring on the close button looks like a bug; keep focus inside the dialog itself
      dialog.tabIndex = -1
      dialog.focus()
    }
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus()
    }
  }, [])
  return ref
}
