import type { LayoutMode } from '../state/types'

interface FocusInput {
  mode: Exclude<LayoutMode, 'gallery'>
  /** Person the user pinned (Sorotan only) */
  pinnedId: string | null
  /** Last stable active speaker, if anyone has spoken */
  speakerId: string | null
  selfId: string
}

/** Who gets the big tile. A pin wins in Sorotan, then the active speaker, then the first other person. */
export function resolveFocusId(ids: readonly string[], { mode, pinnedId, speakerId, selfId }: FocusInput): string {
  const present = new Set(ids)
  if (mode === 'spotlight' && pinnedId && present.has(pinnedId)) return pinnedId
  if (speakerId && present.has(speakerId)) return speakerId
  return ids.find((id) => id !== selfId) ?? selfId
}
