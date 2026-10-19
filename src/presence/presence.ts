import type { Participant } from '../state/types'

/** How long a BRB is expected to take, in minutes */
export const BRB_CHOICES: readonly number[] = [2, 5, 10, 15]

const MINUTE_MS = 60_000

export const isAway = (p: Participant): boolean => p.status !== 'none'

export const statusWord = (p: Participant): string => (p.status === 'afk' ? 'AFK' : 'BRB')

/** "baru saja", "4 mnt", "1 j 5 mnt" */
export function spanText(ms: number): string {
  const minutes = Math.floor(Math.max(0, ms) / MINUTE_MS)
  if (minutes < 1) return 'baru saja'
  if (minutes < 60) return `${minutes} mnt`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} j ${rest} mnt` : `${hours} j`
}

/** Minutes since they left, in words: "4 mnt" */
export function awayFor(p: Participant, now: number): string {
  return p.away ? spanText(now - p.away.since) : ''
}

/**
 * What a tile says next to the status word. A BRB with an estimate counts down ("3 mnt lagi") and, once it runs over,
 * says by how much ("lewat 2 mnt"); everything else counts up from when they left.
 */
export function awayClock(p: Participant, now: number): string {
  const away = p.away
  if (!away) return ''
  if (p.status === 'brb' && away.backAt !== null) {
    const left = away.backAt - now
    if (left >= MINUTE_MS) return `${spanText(left)} lagi`
    if (left > -MINUTE_MS) return 'sebentar lagi'
    return `lewat ${spanText(-left)}`
  }
  return awayFor(p, now)
}

/** The same thing as one sentence, for screen readers and tooltips */
export function awaySentence(p: Participant, now: number): string {
  if (!isAway(p)) return ''
  const clock = awayClock(p, now)
  if (p.status === 'brb' && p.away?.backAt != null) return `${statusWord(p)}, kembali ${clock}`
  return clock === 'baru saja' ? `${statusWord(p)}, baru saja pergi` : `${statusWord(p)}, pergi ${clock}`
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Who a message is for among the people who stepped away: its private recipient and anyone it @mentions */
export function awayRecipients(people: readonly Participant[], toId: string | null, text: string): string[] {
  return people
    .filter((p) => isAway(p) && (p.id === toId || new RegExp(`@${escapeRegExp(p.name)}(?![\\p{L}])`, 'iu').test(text)))
    .map((p) => p.id)
}
