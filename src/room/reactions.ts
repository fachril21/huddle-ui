import type { ReactionName } from '../state/types'
import type { EmojiName } from '../emoji/registry'

/** The eight Meet-style reactions (Design.md 10.1) with their Indonesian labels. */
export const REACTIONS: readonly { name: ReactionName; emoji: EmojiName; label: string }[] = [
  { name: 'thumbs-up', emoji: 'thumbs-up', label: 'Jempol' },
  { name: 'clap', emoji: 'clap', label: 'Tepuk tangan' },
  { name: 'heart', emoji: 'heart', label: 'Hati' },
  { name: 'party', emoji: 'party', label: 'Pesta' },
  { name: 'laugh', emoji: 'laugh', label: 'Tertawa' },
  { name: 'surprised', emoji: 'surprised', label: 'Terkejut' },
  { name: 'thanks', emoji: 'thanks', label: 'Terima kasih' },
  { name: 'fire', emoji: 'fire', label: 'Api' },
]

export const REACTION_BY_NAME = Object.fromEntries(REACTIONS.map((r) => [r.name, r])) as Record<ReactionName, (typeof REACTIONS)[number]>

/** Burst limit: at most 5 reactions from the local user per 2s (Design.md 10.1). */
export const BURST_LIMIT = 5
export const BURST_WINDOW_MS = 2000
