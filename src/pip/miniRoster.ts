import type { Participant } from '../state/types'

/** Tiles the mini window shows before folding the rest into "+N". Six fit without scrolling in two columns. */
export const MINI_MAX_TILES = 6

export interface MiniRoster {
  readonly shown: readonly Participant[]
  /** People who did not fit */
  readonly hidden: number
}

/** Who is worth a tile right now: people talking, then raised hands in queue order, then cameras on, then the rest. */
function rank(p: Participant, speaking: ReadonlySet<string>): number {
  if (speaking.has(p.id)) return 0
  if (p.hand !== null) return 1
  if (p.camOn) return 2
  return 3
}

/** Pick the participants for the mini window. Ties keep the room's own order. */
export function pickMiniRoster(participants: readonly Participant[], speaking: ReadonlySet<string>, max: number = MINI_MAX_TILES): MiniRoster {
  const ordered = participants
    .map((p, index) => ({ p, index }))
    .sort((a, b) => {
      const byRank = rank(a.p, speaking) - rank(b.p, speaking)
      if (byRank !== 0) return byRank
      if (a.p.hand !== null && b.p.hand !== null && a.p.hand !== b.p.hand) return a.p.hand - b.p.hand
      return a.index - b.index
    })
    .map((entry) => entry.p)
  // when everyone fits no tile is spent on a "+N" cell
  if (ordered.length <= max) return { shown: ordered, hidden: 0 }
  const shown = ordered.slice(0, max - 1)
  return { shown, hidden: ordered.length - shown.length }
}
