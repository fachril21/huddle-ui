import type { ReactNode } from 'react'
import styles from './Flat.module.css'

/**
 * Shows a desktop popover's content inside a bottom sheet. The popovers position themselves absolutely above the
 * dock and carry their own glass; here they should simply flow in the sheet, so this strips that outer chrome.
 */
export function Flat({ children }: { children: ReactNode }) {
  return <div className={styles.flat}>{children}</div>
}
