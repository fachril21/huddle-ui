import { Suspense, lazy, useState } from 'react'
import { useFx } from '../room/MotionContext'
import { EMOJI, EMOJI_PACK } from './registry'
import type { EmojiName } from './registry'
import styles from './AnimatedEmoji.module.css'

/** The emoji library carries a large manifest, so it loads as its own chunk after first paint. */
const LibraryEmoji = lazy(() => import('@usespaceui/emoji/react').then((m) => ({ default: m.Emoji })))

/** The library types do not list `loading`, but it reaches the <img> and overrides its lazy default. */
const EAGER = { loading: 'eager' } as Record<string, unknown>

interface AnimatedEmojiProps {
  name: EmojiName
  /** Pixel size */
  size?: number
  /** Accessible name; omit for purely decorative use */
  label?: string
}

/**
 * Animated emoji (Telegram-style). The native glyph is always there first, so a slow or failed download on a phone
 * never leaves a hole; the animated picture fades in over it once it has actually loaded. Under reduced motion and
 * in the "Mati" effects tier only the glyph is used. Swap the pack in registry.ts without touching call sites.
 */
export function AnimatedEmoji({ name, size = 56, label }: AnimatedEmojiProps) {
  const { reduced } = useFx()
  const [loaded, setLoaded] = useState(false)
  const glyph = EMOJI[name]

  return (
    <span className={styles.emoji} style={{ width: size, height: size }} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {!loaded && (
        <span className={styles.native} style={{ fontSize: size * 0.9, width: size, height: size }}>
          {glyph}
        </span>
      )}
      {!reduced && (
        <Suspense fallback={null}>
          <span className={styles.layer} data-ready={loaded || undefined}>
            {/* eager: a lazy image can wait forever inside a sheet or a moving overlay, which is when a phone shows nothing */}
            <LibraryEmoji emoji={glyph} source={EMOJI_PACK.source} type={EMOJI_PACK.type} size={size} onLoad={() => setLoaded(true)} {...EAGER} />
          </span>
        </Suspense>
      )}
    </span>
  )
}

/** Images already requested, kept so the browser cache holds them until an emoji actually appears. */
const warm: HTMLImageElement[] = []

/** Warm the library chunk and the browser cache so emoji do not pop in the first time they appear. */
export function preloadEmoji(names: readonly EmojiName[]) {
  void import('@usespaceui/emoji').then(({ resolveEmojiUrl }) => {
    for (const name of names) {
      try {
        const url = resolveEmojiUrl(EMOJI[name], { source: EMOJI_PACK.source, type: EMOJI_PACK.type })
        if (!url) continue
        const img = new Image()
        img.decoding = 'async'
        img.src = url
        warm.push(img)
      } catch {
        /* missing asset: the native glyph stays */
      }
    }
  })
}
