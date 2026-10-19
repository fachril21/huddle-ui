import { DISPLAY_TZ, USER_NAME } from './constants'
import { SEED_PREFIX } from './meetingStorage'
import { dayKey, zonedToUtc } from './schedule'
import type { Meeting } from './types'

const MIN = 60_000
const DAY = 24 * 60 * MIN
const SOON_MIN = 8
const ROUND_MIN = 5

const NO_SECURITY = { passcode: null, waitingRoom: false, muteOnJoin: false } as const

type Seed = Omit<Meeting, 'id' | 'timezone' | 'cancelled' | 'skipped' | 'security' | 'startsAt'> & { at: Date; passcode?: string; waitingRoom?: boolean }

function make(slug: string, seed: Seed): Meeting {
  const { at, passcode, waitingRoom = false, ...rest } = seed
  return {
    ...rest,
    id: `${SEED_PREFIX}${slug}`,
    startsAt: at.toISOString(),
    timezone: DISPLAY_TZ,
    security: { ...NO_SECURITY, passcode: passcode ?? null, waitingRoom },
    cancelled: false,
    skipped: [],
  }
}

/** Sample agenda anchored to `now`, in Indonesian, with the same people as the room demo. */
export function buildSeed(now: Date): Meeting[] {
  const day = (offset: number, time: string) => zonedToUtc(dayKey(new Date(now.getTime() + offset * DAY)), time, DISPLAY_TZ)
  const soon = new Date(Math.ceil((now.getTime() + SOON_MIN * MIN) / (ROUND_MIN * MIN)) * ROUND_MIN * MIN)

  return [
    make('brainstorm', {
      code: 'abc-defg-hij',
      title: 'Brainstorm sprint',
      description: 'Tentukan prioritas sprint berikutnya.',
      at: soon,
      durationMin: 60,
      recurrence: 'none',
      invitees: ['dewi@huddle.id', 'raka@huddle.id', 'bima@huddle.id', 'sari@huddle.id'],
      hostName: USER_NAME,
      isHost: true,
      passcode: '482913',
    }),
    make('standup', {
      code: 'sdn-upkm-pln',
      title: 'Stand-up harian',
      description: '',
      at: day(-5, '09:30'),
      durationMin: 15,
      recurrence: 'daily',
      invitees: ['dewi@huddle.id', 'raka@huddle.id', 'maya@huddle.id'],
      hostName: USER_NAME,
      isHost: true,
    }),
    make('review-desain', {
      code: 'kqz-mwen-trb',
      title: 'Review desain mingguan',
      description: 'Bawa progres desain terbaru.',
      at: day(0, '15:00'),
      durationMin: 45,
      recurrence: 'weekly',
      invitees: ['maya@huddle.id', 'fajar@huddle.id', 'laras@huddle.id'],
      hostName: 'Dewi',
      isHost: false,
      waitingRoom: true,
    }),
    make('satu-satu', {
      code: 'pwt-ldnr-vxa',
      title: '1:1 dengan Dewi',
      description: '',
      at: day(1, '10:00'),
      durationMin: 30,
      recurrence: 'none',
      invitees: ['dewi@huddle.id'],
      hostName: USER_NAME,
      isHost: true,
    }),
    make('retro', {
      code: 'rtr-ospr-tku',
      title: 'Retro sprint',
      description: 'Apa yang berjalan baik, apa yang perlu diubah.',
      at: day(3, '15:00'),
      durationMin: 90,
      recurrence: 'none',
      invitees: ['dewi@huddle.id', 'raka@huddle.id', 'bima@huddle.id', 'sari@huddle.id', 'andi@huddle.id'],
      hostName: USER_NAME,
      isHost: true,
    }),
    make('demo-klien', {
      code: 'dmk-lien-sbr',
      title: 'Demo untuk klien',
      description: '',
      at: day(6, '13:00'),
      durationMin: 60,
      recurrence: 'none',
      invitees: ['fachril@huddle.id', 'citra@huddle.id'],
      hostName: 'Maya',
      isHost: false,
    }),
    make('kickoff', {
      code: 'kck-offq-rtr',
      title: 'Kickoff kuartal empat',
      description: '',
      at: day(-1, '14:00'),
      durationMin: 60,
      recurrence: 'none',
      invitees: ['dewi@huddle.id', 'raka@huddle.id'],
      hostName: USER_NAME,
      isHost: true,
    }),
    make('workshop', {
      code: 'wrk-shop-onb',
      title: 'Workshop onboarding',
      description: '',
      at: day(-3, '10:00'),
      durationMin: 90,
      recurrence: 'none',
      invitees: ['fachril@huddle.id'],
      hostName: 'Sari',
      isHost: false,
    }),
  ]
}
