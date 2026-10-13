/** The mock meeting started at 10:40; message times are seconds after (or before) the page loaded. */
const CLOCK_BASE_SECONDS = 10 * 3600 + 40 * 60

export function formatChatTime(at: number): string {
  const total = (((CLOCK_BASE_SECONDS + at) % 86400) + 86400) % 86400
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** The partial "@name" being typed at the end of the text, or null. */
export function activeMention(text: string): string | null {
  const match = /(?:^|\s)@([\p{L}]*)$/u.exec(text)
  return match ? match[1] : null
}

/** Replace the trailing "@partial" with the chosen name. */
export function applyMention(text: string, name: string): string {
  return text.replace(/@([\p{L}]*)$/u, `@${name} `)
}
