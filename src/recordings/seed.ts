import { USER_NAME } from '../dashboard/constants'
import type { Recording } from './types'

const MIN = 60_000
const HOUR = 60 * MIN

/** Sample recordings anchored to `now`, spread across every stage of the 24 hour life. */
export function buildRecordings(now: Date): Recording[] {
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString()
  const make = (id: string, r: Omit<Recording, 'id' | 'startedAt' | 'stoppedAt'> & { stoppedAgo: number | null; lengthMin: number }): Recording => {
    const { stoppedAgo, lengthMin, ...rest } = r
    const stoppedMs = stoppedAgo ?? 0
    return {
      ...rest,
      id,
      startedAt: ago(stoppedMs + lengthMin * MIN),
      stoppedAt: stoppedAgo === null ? null : ago(stoppedAgo),
    }
  }

  return [
    make('rec-kickoff', {
      title: 'Kickoff kuartal empat',
      code: 'kck-offq-rtr',
      hostName: USER_NAME,
      participants: [USER_NAME, 'Dewi', 'Raka', 'Bima', 'Sari'],
      stoppedAgo: 2 * HOUR + 10 * MIN,
      lengthMin: 62,
      stopReason: 'meeting-ended',
      durationSec: 62 * 60 + 14,
      sizeMb: 718,
      status: 'ready',
    }),
    make('rec-review', {
      title: 'Review desain mingguan',
      code: 'kqz-mwen-trb',
      hostName: 'Dewi',
      participants: ['Dewi', USER_NAME, 'Maya', 'Fajar', 'Laras'],
      stoppedAgo: 14 * HOUR + 35 * MIN,
      lengthMin: 47,
      stopReason: 'room-empty',
      durationSec: 47 * 60 + 41,
      sizeMb: 552,
      status: 'ready',
    }),
    make('rec-standup', {
      title: 'Stand-up harian',
      code: 'sdn-upkm-pln',
      hostName: USER_NAME,
      participants: [USER_NAME, 'Dewi', 'Raka', 'Maya'],
      stoppedAgo: 21 * HOUR + 40 * MIN,
      lengthMin: 14,
      stopReason: 'host-stopped',
      durationSec: 14 * 60 + 52,
      sizeMb: 161,
      status: 'ready',
    }),
    make('rec-workshop', {
      title: 'Workshop onboarding',
      code: 'wrk-shop-onb',
      hostName: 'Sari',
      participants: ['Sari', USER_NAME, 'Citra', 'Andi'],
      stoppedAgo: 26 * HOUR,
      lengthMin: 93,
      stopReason: 'meeting-ended',
      durationSec: 93 * 60 + 5,
      sizeMb: 1_080,
      status: 'ready',
    }),
    make('rec-demo-lama', {
      title: 'Demo untuk klien',
      code: 'dmk-lien-sbr',
      hostName: 'Maya',
      participants: ['Maya', USER_NAME, 'Citra'],
      stoppedAgo: 4 * 24 * HOUR,
      lengthMin: 58,
      stopReason: 'room-empty',
      durationSec: 58 * 60 + 20,
      sizeMb: 664,
      status: 'ready',
    }),
  ]
}
