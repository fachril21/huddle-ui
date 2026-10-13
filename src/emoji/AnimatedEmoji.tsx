import { Emoji } from '@usespaceui/emoji/react'
import { resolveEmojiUrl } from '@usespaceui/emoji'
import { useReducedMotion } from '../room/useReducedMotion'
import { EMOJI, EMOJI_PACK } from './registry'
import type { EmojiName } from './registry'
import styles from './AnimatedEmoji.module.css'

interface AnimatedEmojiProps {
  name: EmojiName
  /** Pixel size */
  size?: number
  /** Accessible name; omit for purely decorative use */
  label?: string
}

/**
 * Animated emoji (Telegram-style). Loops by itself; shows the native glyph if the asset cannot load
 * (offline demo) and under reduced motion. Swap the pack in registry.ts without touching call sites.
 */
export function AnimatedEmoji({ name, size = 56, label }: AnimatedEmojiProps) {
  const reduced = useReducedMotion()
  return (
    <span className={styles.emoji} style={{ width: size, height: size }} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <Emoji emoji={EMOJI[name]} source={EMOJI_PACK.source} type={reduced ? 'pure' : EMOJI_PACK.type} size={size} fallback />
    </span>
  )
}

/** Warm the browser cache so emoji do not pop in the first time they appear. */
export function preloadEmoji(names: readonly EmojiName[]) {
  for (const name of names) {
    try {
      const url = resolveEmojiUrl(EMOJI[name], { source: EMOJI_PACK.source, type: EMOJI_PACK.type })
      if (url) new Image().src = url
    } catch {
      /* missing asset: native fallback will render */
    }
  }
}
