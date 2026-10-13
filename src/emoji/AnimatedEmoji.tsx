import { Suspense, lazy } from 'react'
import { useFx } from '../room/MotionContext'
import { EMOJI, EMOJI_PACK } from './registry'
import type { EmojiName } from './registry'
import styles from './AnimatedEmoji.module.css'

/** The emoji library carries a large manifest, so it loads as its own chunk after first paint. */
const LibraryEmoji = lazy(() => import('@usespaceui/emoji/react').then((m) => ({ default: m.Emoji })))

interface AnimatedEmojiProps {
  name: EmojiName
  /** Pixel size */
  size?: number
  /** Accessible name; omit for purely decorative use */
  label?: string
}

/**
 * Animated emoji (Telegram-style). Loops by itself; shows the native glyph while the library chunk loads,
 * if the asset cannot load (offline demo), under reduced motion, and in the "Mati" effects tier.
 * Swap the pack in registry.ts without touching call sites.
 */
export function AnimatedEmoji({ name, size = 56, label }: AnimatedEmojiProps) {
  const { reduced } = useFx()
  const glyph = EMOJI[name]
  const native = (
    <span className={styles.native} style={{ fontSize: size * 0.9, width: size, height: size }}>
      {glyph}
    </span>
  )

  return (
    <span className={styles.emoji} style={{ width: size, height: size }} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {reduced ? (
        native
      ) : (
        <Suspense fallback={native}>
          <LibraryEmoji emoji={glyph} source={EMOJI_PACK.source} type={EMOJI_PACK.type} size={size} fallback />
        </Suspense>
      )}
    </span>
  )
}

/** Warm the library chunk and the browser cache so emoji do not pop in the first time they appear. */
export function preloadEmoji(names: readonly EmojiName[]) {
  void import('@usespaceui/emoji').then(({ resolveEmojiUrl }) => {
    for (const name of names) {
      try {
        const url = resolveEmojiUrl(EMOJI[name], { source: EMOJI_PACK.source, type: EMOJI_PACK.type })
        if (url) new Image().src = url
      } catch {
        /* missing asset: native fallback will render */
      }
    }
  })
}
