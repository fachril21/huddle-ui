import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

/** Renders children into another window's body. They stay part of this React tree, so state and context carry over. */
export function PipPortal({ target, children }: { target: Window | null; children: ReactNode }) {
  if (!target) return null
  return createPortal(children, target.document.body)
}
