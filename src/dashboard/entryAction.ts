import type { OccurrenceState } from './types'

export interface EntryAction {
  readonly label: string
  readonly variant: 'primary' | 'secondary'
  readonly enabled: boolean
}

/**
 * The way into a session. The link works whenever it is opened, so everyone gets the same "Join" and nobody
 * has to start anything: a guest who arrives before the host waits in the waiting room. Before the session
 * window opens the button is quieter. Ended sessions have no way in.
 */
export function entryAction(state: OccurrenceState): EntryAction | null {
  switch (state) {
    case 'ended':
      return null
    case 'live':
    case 'joinable':
      return { label: 'Join', variant: 'primary', enabled: true }
    case 'upcoming':
      return { label: 'Join', variant: 'secondary', enabled: true }
  }
}
