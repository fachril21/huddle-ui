/**
 * Animated emoji registry. Each entry is the Unicode glyph; @usespaceui/emoji resolves it to an animated asset.
 * EMOJI_PACK is the single switch for the visual set. NOTE: Telegram/Apple/Fluent artwork has its own licence
 * (the library itself is MIT); `noto` (Google, CC BY 4.0) is the safer pick for anything beyond a prototype.
 */
export const EMOJI_PACK = { source: 'telegram', type: 'anim' } as const

export const EMOJI = {
  'hand-wave': '👋',
  'hand-reach': '🫴',
  'high-five': '🙌',
  'thumbs-up': '👍',
  clap: '👏',
  heart: '❤️',
  party: '🎉',
  laugh: '😂',
  surprised: '😮',
  thanks: '🙏',
  fire: '🔥',
  sleep: '😴',
  coffee: '☕',
  trophy: '🏆',
  drum: '🎶',
  wow: '🤯',
  ding: '✨',
  horn: '📣',
  rimshot: '🤡',
  sad: '😭',
  cricket: '🦗',
  whoosh: '🚀',
  cheer: '🥳',
  levelup: '🆙',
} as const

export type EmojiName = keyof typeof EMOJI
