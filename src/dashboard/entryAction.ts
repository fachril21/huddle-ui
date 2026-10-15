import type { OccurrenceState } from './types'

export interface EntryAction {
  readonly label: string
  readonly variant: 'primary' | 'secondary'
  readonly enabled: boolean
}

/**
 * The way into a session. Everyone can enter from ten minutes before the start; only the host may open
 * the room earlier. Ended sessions have no way in.
 */
export function entryAction(isHost: boolean, state: OccurrenceState): EntryAction | null {
  switch (state) {
    case 'ended':
      return null
    case 'live':
      return { label: 'Masuk', variant: 'primary', enabled: true }
    case 'joinable':
      return { label: isHost ? 'Mulai' : 'Masuk', variant: 'primary', enabled: true }
    case 'upcoming':
      return isHost ? { label: 'Mulai lebih awal', variant: 'secondary', enabled: true } : { label: 'Belum dibuka', variant: 'secondary', enabled: false }
  }
}
