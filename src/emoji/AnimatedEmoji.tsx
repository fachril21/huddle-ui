import type { CSSProperties } from 'react'
import { EMOJI } from './registry'
import type { EmojiEntry, EmojiName } from './registry'
import styles from './AnimatedEmoji.module.css'

interface AnimatedEmojiProps {
  name: EmojiName
  /** Pixel size of the glyph */
  size?: number
  /** Repeat with a 1.2s rest between loops (Design.md 8.1). false plays once. */
  loop?: boolean
  /** Accessible name; omit for purely decorative use */
  label?: string
}

/** Abstraction over animated emoji. Unicode + CSS animation now; Lottie later via registry `lottieSrc`. */
export function AnimatedEmoji({ name, size = 56, loop = true, label }: AnimatedEmojiProps) {
  const entry: EmojiEntry = EMOJI[name]
  const style = { '--emoji-size': `${size}px` } as CSSProperties

  return (
    <span
      className={styles.emoji}
      data-anim={entry.animation}
      data-loop={loop}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {entry.glyph}
    </span>
  )
}
