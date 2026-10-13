import type { Poll } from '../../state/types'

export interface PollTally {
  readonly counts: Readonly<Record<string, number>>
  /** people who voted (a multi-choice voter counts once) */
  readonly voters: number
  /** option ids with the highest count; empty until someone votes */
  readonly winners: readonly string[]
  readonly isTie: boolean
}

export function tally(poll: Poll): PollTally {
  const counts: Record<string, number> = Object.fromEntries(poll.options.map((o) => [o.id, 0]))
  for (const chosen of Object.values(poll.votes)) for (const id of chosen) counts[id] = (counts[id] ?? 0) + 1
  const max = Math.max(0, ...Object.values(counts))
  const winners = max === 0 ? [] : poll.options.filter((o) => counts[o.id] === max).map((o) => o.id)
  return { counts, voters: Object.keys(poll.votes).length, winners, isTie: winners.length > 1 }
}

export const AUTO_CLOSE_CHOICES: readonly { label: string; seconds: number | null }[] = [
  { label: 'Manual', seconds: null },
  { label: '30 dtk', seconds: 30 },
  { label: '1 mnt', seconds: 60 },
  { label: '2 mnt', seconds: 120 },
  { label: '5 mnt', seconds: 300 },
]

export const MAX_QUESTION = 200
export const MAX_OPTION = 80
export const MIN_OPTIONS = 2
export const MAX_OPTIONS = 6

/** Ready-made sample (PRD 11.3). */
export const SAMPLE_POLL = {
  question: 'Rilis fitur baru minggu depan atau ditunda?',
  options: ['Rilis minggu depan', 'Tunda dua minggu', 'Rilis bertahap'],
}
