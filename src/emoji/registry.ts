/**
 * Animated emoji registry. Today every entry is a Unicode fallback with a CSS animation.
 * When licensed Lottie files exist (M3), set `lottieSrc` per entry and the component switches to the player;
 * no call site changes. Do not download assets from random sources: licensing is undecided.
 */
export type EmojiAnimation = 'wave' | 'reach' | 'bounce' | 'pulse' | 'pop' | 'wobble' | 'flicker' | 'float'

export interface EmojiEntry {
  readonly glyph: string
  readonly animation: EmojiAnimation
  /** Path under /public/emoji, e.g. '/emoji/wave.lottie'. Unset until the asset licence is decided. */
  readonly lottieSrc?: string
}

export const EMOJI = {
  'hand-wave': { glyph: '👋', animation: 'wave' },
  'hand-reach': { glyph: '🫴', animation: 'reach' },
  'high-five': { glyph: '🙌', animation: 'pop' },
  'thumbs-up': { glyph: '👍', animation: 'bounce' },
  clap: { glyph: '👏', animation: 'pulse' },
  heart: { glyph: '❤️', animation: 'pulse' },
  party: { glyph: '🎉', animation: 'pop' },
  laugh: { glyph: '😂', animation: 'wobble' },
  surprised: { glyph: '😮', animation: 'pop' },
  thanks: { glyph: '🙏', animation: 'bounce' },
  fire: { glyph: '🔥', animation: 'flicker' },
  sleep: { glyph: '😴', animation: 'float' },
  coffee: { glyph: '☕', animation: 'float' },
  trophy: { glyph: '🏆', animation: 'pop' },
} as const satisfies Record<string, EmojiEntry>

export type EmojiName = keyof typeof EMOJI
