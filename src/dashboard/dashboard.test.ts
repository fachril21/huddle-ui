import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { matchDashboardShortcut } from './dashboardShortcuts'
import { generateMeetingCode, generatePasscode, isMeetingCode, parseJoinInput } from './meetingCode'
import { meetingReducer, findByCode } from './meetingStore'
import { parseStored } from './meetingStorage'
import { nameFromEmail, paletteFor } from './people'
import {
  allOccurrences,
  buildInvitationText,
  countdownLabel,
  dayLabel,
  greetingFor,
  groupByDay,
  occurrenceState,
  occurrencesBetween,
  parseInvitees,
  pickNext,
  utcToZoned,
  validateSchedule,
  zonedToUtc,
} from './schedule'
import { buildSeed } from './seed'
import type { Meeting } from './types'

const HOUR = 3_600_000
const DAY = 24 * HOUR
const NOW = new Date('2026-10-15T03:42:00Z') // 10:42 WIB

const base: Meeting = {
  id: 'm1',
  code: 'abc-defg-hij',
  title: 'Sprint planning',
  description: '',
  startsAt: '2026-10-15T04:00:00.000Z', // 11:00 WIB
  durationMin: 45,
  timezone: 'Asia/Jakarta',
  recurrence: 'none',
  invitees: [],
  hostName: 'Fachril',
  isHost: true,
  security: { passcode: null, waitingRoom: false, muteOnJoin: false },
  cancelled: false,
  skipped: [],
}
const meeting = (patch: Partial<Meeting> = {}): Meeting => ({ ...base, ...patch })

describe('meeting codes', () => {
  it('generates the 3-4-3 shape from any random source', () => {
    expect(isMeetingCode(generateMeetingCode())).toBe(true)
    expect(generateMeetingCode(() => 0)).toBe('aaa-aaaa-aaa')
    expect(generateMeetingCode(() => 0.999)).toBe('zzz-zzzz-zzz')
  })

  it('generates a six-digit passcode', () => {
    expect(generatePasscode()).toMatch(/^\d{6}$/)
  })

  it.each([
    ['abc-defg-hij', 'abc-defg-hij'],
    ['  ABC-DEFG-HIJ  ', 'abc-defg-hij'],
    ['abcdefghij', 'abc-defg-hij'],
    ['abc defg hij', 'abc-defg-hij'],
    ['https://huddle.dibimbing.id/abc-defg-hij', 'abc-defg-hij'],
    ['huddle.dibimbing.id/abc-defg-hij', 'abc-defg-hij'],
    ['https://huddle.dibimbing.id/abc-defg-hij?x=1#y', 'abc-defg-hij'],
  ])('accepts %j', (input, code) => {
    expect(parseJoinInput(input)).toEqual({ kind: 'ok', code })
  })

  it('reports empty, malformed and foreign input separately', () => {
    expect(parseJoinInput('   ')).toEqual({ kind: 'empty' })
    expect(parseJoinInput('abc-def')).toEqual({ kind: 'format' })
    expect(parseJoinInput('abc-defg-hij-k')).toEqual({ kind: 'format' })
    expect(parseJoinInput('https://meet.google.com/abc-defg-hij')).toEqual({ kind: 'foreign' })
    expect(parseJoinInput('https://huddle.dibimbing.id/')).toEqual({ kind: 'format' })
  })
})

describe('time zones', () => {
  it('converts wall-clock time in a zone to the instant', () => {
    expect(zonedToUtc('2026-10-15', '11:00', 'Asia/Jakarta').toISOString()).toBe('2026-10-15T04:00:00.000Z')
    expect(zonedToUtc('2026-10-15', '11:00', 'Asia/Jayapura').toISOString()).toBe('2026-10-15T02:00:00.000Z')
    expect(zonedToUtc('2026-10-15', '11:00', 'UTC').toISOString()).toBe('2026-10-15T11:00:00.000Z')
  })

  it('round-trips through utcToZoned, including across midnight', () => {
    expect(utcToZoned(new Date('2026-10-15T17:30:00Z'), 'Asia/Jakarta')).toEqual({ date: '2026-10-16', time: '00:30' })
    const back = zonedToUtc('2026-10-16', '00:30', 'Asia/Jakarta')
    expect(back.toISOString()).toBe('2026-10-15T17:30:00.000Z')
  })

  it('resolves a DST zone on both sides of the change', () => {
    expect(zonedToUtc('2026-07-01', '09:00', 'America/New_York').toISOString()).toBe('2026-07-01T13:00:00.000Z')
    expect(zonedToUtc('2026-12-01', '09:00', 'America/New_York').toISOString()).toBe('2026-12-01T14:00:00.000Z')
  })
})

describe('validateSchedule', () => {
  const ok = { title: 'Rapat', date: '2026-10-16', time: '10:00', durationMin: 30, timezone: 'Asia/Jakarta', invitees: [], passcodeOn: false, passcode: '' }

  it('accepts a complete future meeting', () => {
    expect(validateSchedule(ok, NOW)).toEqual({})
  })

  it('rejects a blank or whitespace-only title and an overlong one', () => {
    expect(validateSchedule({ ...ok, title: '   ' }, NOW).title).toBeDefined()
    expect(validateSchedule({ ...ok, title: 'x'.repeat(81) }, NOW).title).toBeDefined()
    expect(validateSchedule({ ...ok, title: 'x'.repeat(80) }, NOW).title).toBeUndefined()
  })

  it('rejects a start in the past or missing, but tolerates the current minute', () => {
    expect(validateSchedule({ ...ok, date: '2026-10-15', time: '09:00' }, NOW).when).toBeDefined()
    expect(validateSchedule({ ...ok, date: '', time: '' }, NOW).when).toBeDefined()
    expect(validateSchedule({ ...ok, date: '2026-10-15', time: '10:42' }, NOW).when).toBeUndefined()
  })

  it('judges the start in the chosen zone, not the viewer zone', () => {
    // 10:00 in Jayapura is 08:00 WIB, already past; 13:00 in Jayapura is 11:00 WIB, still ahead
    expect(validateSchedule({ ...ok, date: '2026-10-15', time: '10:00', timezone: 'Asia/Jayapura' }, NOW).when).toBeDefined()
    expect(validateSchedule({ ...ok, date: '2026-10-15', time: '13:00', timezone: 'Asia/Jayapura' }, NOW).when).toBeUndefined()
  })

  it('bounds the duration', () => {
    expect(validateSchedule({ ...ok, durationMin: 0 }, NOW).duration).toBeDefined()
    expect(validateSchedule({ ...ok, durationMin: 481 }, NOW).duration).toBeDefined()
    expect(validateSchedule({ ...ok, durationMin: NaN }, NOW).duration).toBeDefined()
  })

  it('requires a 4-8 digit passcode only when switched on', () => {
    expect(validateSchedule({ ...ok, passcodeOn: true, passcode: '12' }, NOW).passcode).toBeDefined()
    expect(validateSchedule({ ...ok, passcodeOn: true, passcode: '1234' }, NOW).passcode).toBeUndefined()
    expect(validateSchedule({ ...ok, passcodeOn: false, passcode: '' }, NOW).passcode).toBeUndefined()
  })

  it('caps the invitee count', () => {
    const many = Array.from({ length: 101 }, (_, i) => `u${i}@x.id`)
    expect(validateSchedule({ ...ok, invitees: many }, NOW).invitees).toBeDefined()
  })
})

describe('parseInvitees', () => {
  it('splits on commas, semicolons and whitespace and drops duplicates ignoring case', () => {
    const r = parseInvitees('a@x.id, B@x.id;a@X.ID\nc@x.id')
    expect(r.valid).toEqual(['a@x.id', 'B@x.id', 'c@x.id'])
    expect(r.invalid).toEqual([])
  })

  it('separates invalid addresses', () => {
    const r = parseInvitees('a@x.id nope @x.id a@b')
    expect(r.valid).toEqual(['a@x.id'])
    expect(r.invalid).toEqual(['nope', '@x.id', 'a@b'])
  })
})

describe('occurrences', () => {
  const from = new Date('2026-10-15T00:00:00Z')
  const to = new Date(from.getTime() + 8 * DAY)

  it('gives a one-off meeting a single session', () => {
    const [o] = occurrencesBetween(meeting(), from, to)
    expect(o.start.toISOString()).toBe(base.startsAt)
    expect(o.end.getTime() - o.start.getTime()).toBe(45 * 60_000)
    expect(occurrencesBetween(meeting(), new Date(to), new Date(to.getTime() + DAY))).toHaveLength(0)
  })

  it('repeats daily and weekly from the first session', () => {
    expect(occurrencesBetween(meeting({ recurrence: 'daily' }), from, to)).toHaveLength(8)
    expect(occurrencesBetween(meeting({ recurrence: 'weekly' }), from, to)).toHaveLength(2)
  })

  it('starts a series in the past without listing sessions before the range', () => {
    const old = meeting({ recurrence: 'daily', startsAt: new Date(from.getTime() - 400 * DAY + 4 * HOUR).toISOString() })
    const list = occurrencesBetween(old, from, to)
    expect(list).toHaveLength(8)
    expect(list[0].start.getTime()).toBeGreaterThanOrEqual(from.getTime())
  })

  it('keeps a monthly meeting on the same day, clamping short months', () => {
    const m = meeting({ recurrence: 'monthly', startsAt: '2026-01-31T04:00:00.000Z' })
    const feb = occurrencesBetween(m, new Date('2026-02-01T00:00:00Z'), new Date('2026-03-01T00:00:00Z'))
    expect(feb.map((o) => o.start.toISOString())).toEqual(['2026-02-28T04:00:00.000Z'])
    const mar = occurrencesBetween(m, new Date('2026-03-01T00:00:00Z'), new Date('2026-04-01T00:00:00Z'))
    expect(mar.map((o) => o.start.toISOString())).toEqual(['2026-03-31T04:00:00.000Z'])
  })

  it('skips cancelled sessions and cancelled meetings', () => {
    const daily = meeting({ recurrence: 'daily', skipped: ['2026-10-16T04:00:00.000Z'] })
    const list = occurrencesBetween(daily, from, to)
    expect(list).toHaveLength(7)
    expect(list.some((o) => o.start.toISOString() === '2026-10-16T04:00:00.000Z')).toBe(false)
    expect(occurrencesBetween(meeting({ cancelled: true }), from, to)).toEqual([])
  })

  it('includes a session that began before the range but is still running', () => {
    const running = occurrencesBetween(meeting(), new Date('2026-10-15T04:20:00Z'), new Date('2026-10-15T23:00:00Z'))
    expect(running).toHaveLength(1)
  })

  it('merges meetings in start order', () => {
    const a = meeting({ id: 'a', startsAt: '2026-10-15T08:00:00.000Z' })
    const b = meeting({ id: 'b', startsAt: '2026-10-15T02:00:00.000Z' })
    expect(allOccurrences([a, b], from, to).map((o) => o.meeting.id)).toEqual(['b', 'a'])
  })
})

describe('occurrence state', () => {
  const o = occurrencesBetween(meeting(), new Date('2026-10-15T00:00:00Z'), new Date('2026-10-16T00:00:00Z'))[0] // 04:00-04:45Z
  const at = (iso: string) => new Date(iso)

  it('moves from upcoming to joinable to live to ended', () => {
    expect(occurrenceState(o, at('2026-10-15T03:40:00Z'))).toBe('upcoming')
    expect(occurrenceState(o, at('2026-10-15T03:50:00Z'))).toBe('joinable')
    expect(occurrenceState(o, at('2026-10-15T04:00:00Z'))).toBe('live')
    expect(occurrenceState(o, at('2026-10-15T04:45:00Z'))).toBe('ended')
  })

  it('opens the join window exactly ten minutes before the start', () => {
    expect(occurrenceState(o, at('2026-10-15T03:49:59Z'))).toBe('upcoming')
    expect(occurrenceState(o, at('2026-10-15T03:50:00Z'))).toBe('joinable')
  })

  it('words the countdown', () => {
    expect(countdownLabel(o, NOW)).toBe('Mulai 18 menit lagi')
    expect(countdownLabel(o, at('2026-10-15T04:10:00Z'))).toBe('Sedang berlangsung')
    expect(countdownLabel(o, at('2026-10-15T05:00:00Z'))).toBe('Selesai')
    expect(countdownLabel(o, at('2026-10-15T01:00:00Z'))).toBe('Mulai 3 jam lagi')
    expect(countdownLabel(o, at('2026-10-13T04:00:00Z'))).toBe('Kamis, 15 Oktober, 11:00')
  })

  it('picks the soonest session that has not ended', () => {
    const ended = meeting({ id: 'e', startsAt: '2026-10-15T01:00:00.000Z' })
    const later = meeting({ id: 'l', startsAt: '2026-10-15T08:00:00.000Z' })
    const list = allOccurrences([later, ended, meeting()], new Date('2026-10-15T00:00:00Z'), new Date('2026-10-16T00:00:00Z'))
    expect(pickNext(list, NOW)?.meeting.id).toBe('m1')
    expect(pickNext(list, new Date('2026-10-15T10:00:00Z'))).toBeNull()
  })
})

describe('grouping and labels', () => {
  it('labels today, tomorrow and yesterday relative to now, in WIB', () => {
    expect(dayLabel(new Date('2026-10-15T20:00:00Z'), NOW)).toBe('Besok') // 03:00 WIB on the 16th
    expect(dayLabel(new Date('2026-10-14T18:00:00Z'), NOW)).toBe('Hari ini') // 01:00 WIB on the 15th
    expect(dayLabel(new Date('2026-10-14T10:00:00Z'), NOW)).toBe('Kemarin')
    expect(dayLabel(new Date('2026-10-20T04:00:00Z'), NOW)).toMatch(/20 Oktober/)
  })

  it('groups sessions of the same WIB day together and keeps order', () => {
    const list = allOccurrences(
      [meeting({ id: 'a' }), meeting({ id: 'b', startsAt: '2026-10-15T09:00:00.000Z' }), meeting({ id: 'c', startsAt: '2026-10-16T04:00:00.000Z' })],
      new Date('2026-10-15T00:00:00Z'),
      new Date('2026-10-17T00:00:00Z'),
    )
    const groups = groupByDay(list, NOW)
    expect(groups.map((g) => [g.label, g.occurrences.length])).toEqual([
      ['Hari ini', 2],
      ['Besok', 1],
    ])
  })
})

describe('greetingFor', () => {
  it('follows the WIB hour', () => {
    expect(greetingFor(new Date('2026-10-15T17:30:00Z'))).toBe('Selamat malam') // 00:30
    expect(greetingFor(new Date('2026-10-14T22:00:00Z'))).toBe('Selamat pagi') // 05:00
    expect(greetingFor(NOW)).toBe('Selamat pagi') // 10:42
    expect(greetingFor(new Date('2026-10-15T04:00:00Z'))).toBe('Selamat siang') // 11:00
    expect(greetingFor(new Date('2026-10-15T09:00:00Z'))).toBe('Selamat sore') // 16:00
    expect(greetingFor(new Date('2026-10-15T11:00:00Z'))).toBe('Selamat malam') // 18:00
  })
})

describe('people helpers', () => {
  it('derives a readable name from an email', () => {
    expect(nameFromEmail('dewi.lestari@huddle.id')).toBe('Dewi Lestari')
    expect(nameFromEmail('raka@huddle.id')).toBe('Raka')
    expect(nameFromEmail('@huddle.id')).toBe('@huddle.id')
  })

  it('gives the same palette to the same person', () => {
    expect(paletteFor('Dewi')).toBe(paletteFor('dewi'))
    expect(['borealis', 'nebula', 'solstice', 'abyss', 'orchid', 'verdant']).toContain(paletteFor('Raka'))
  })
})

describe('buildInvitationText', () => {
  it('lists topic, time, link, code and passcode', () => {
    const text = buildInvitationText(
      meeting({ title: 'Retro', description: 'Bawa catatan', recurrence: 'weekly', security: { passcode: '123456', waitingRoom: false, muteOnJoin: false } }),
      new Date(base.startsAt),
    )
    expect(text).toContain('Fachril mengundang Anda ke rapat Huddle.')
    expect(text).toContain('Topik: Retro')
    expect(text).toContain('11:00–11:45 WIB')
    expect(text).toContain('Berulang: setiap minggu')
    expect(text).toContain('Catatan: Bawa catatan')
    expect(text).toContain('Gabung: https://huddle.dibimbing.id/abc-defg-hij')
    expect(text).toContain('Kode sandi: 123456')
  })

  it('omits optional lines', () => {
    const text = buildInvitationText(meeting(), new Date(base.startsAt))
    expect(text).not.toContain('Berulang')
    expect(text).not.toContain('Catatan')
    expect(text).not.toContain('Kode sandi')
  })
})

describe('meetingReducer', () => {
  const state = { meetings: [meeting({ recurrence: 'weekly' })] }

  it('adds without mutating', () => {
    const next = meetingReducer(state, { type: 'add', meeting: meeting({ id: 'm2' }) })
    expect(next.meetings).toHaveLength(2)
    expect(state.meetings).toHaveLength(1)
  })

  it('updates only the matching meeting', () => {
    const next = meetingReducer({ meetings: [meeting(), meeting({ id: 'm2' })] }, { type: 'update', id: 'm2', patch: { title: 'Baru' } })
    expect(next.meetings.map((m) => m.title)).toEqual(['Sprint planning', 'Baru'])
  })

  it('cancels a whole series', () => {
    expect(meetingReducer(state, { type: 'cancelSeries', id: 'm1' }).meetings[0].cancelled).toBe(true)
  })

  it('cancels one session once, however many times it is asked', () => {
    const once = meetingReducer(state, { type: 'cancelOccurrence', id: 'm1', startIso: '2026-10-22T04:00:00.000Z' })
    const twice = meetingReducer(once, { type: 'cancelOccurrence', id: 'm1', startIso: '2026-10-22T04:00:00.000Z' })
    expect(twice.meetings[0].skipped).toEqual(['2026-10-22T04:00:00.000Z'])
  })

  it('moves one edited session out of the series into a one-off meeting', () => {
    const replacement = meeting({ id: 'm3', title: 'Hanya minggu ini', recurrence: 'none', startsAt: '2026-10-22T07:00:00.000Z' })
    const next = meetingReducer(state, { type: 'editOccurrence', id: 'm1', startIso: '2026-10-22T04:00:00.000Z', replacement })
    expect(next.meetings).toHaveLength(2)
    expect(next.meetings[0].skipped).toContain('2026-10-22T04:00:00.000Z')
    const sessions = allOccurrences(next.meetings, new Date('2026-10-22T00:00:00Z'), new Date('2026-10-23T00:00:00Z'))
    expect(sessions.map((o) => o.meeting.title)).toEqual(['Hanya minggu ini'])
  })

  it('finds live meetings by code and ignores cancelled ones', () => {
    expect(findByCode(state.meetings, 'abc-defg-hij')?.id).toBe('m1')
    expect(findByCode([meeting({ cancelled: true })], 'abc-defg-hij')).toBeUndefined()
    expect(findByCode(state.meetings, 'zzz-zzzz-zzz')).toBeUndefined()
  })
})

describe('parseStored', () => {
  it('round-trips valid meetings', () => {
    expect(parseStored(JSON.stringify([base]))).toEqual([base])
  })

  it('returns nothing for missing, broken or foreign data', () => {
    expect(parseStored(null)).toEqual([])
    expect(parseStored('{not json')).toEqual([])
    expect(parseStored('{"a":1}')).toEqual([])
  })

  it('drops malformed entries but keeps the good ones', () => {
    const bad = { ...base, id: 'bad', code: 'nope' }
    const worse = { ...base, id: 'worse', security: null }
    expect(parseStored(JSON.stringify([bad, base, worse])).map((m) => m.id)).toEqual(['m1'])
  })
})

describe('buildSeed', () => {
  const seed = buildSeed(NOW)

  it('has unique ids and valid codes', () => {
    expect(new Set(seed.map((m) => m.id)).size).toBe(seed.length)
    expect(seed.every((m) => isMeetingCode(m.code))).toBe(true)
    expect(new Set(seed.map((m) => m.code)).size).toBe(seed.length)
  })

  it('opens with a meeting about to start, so the page shows a joinable state', () => {
    const next = pickNext(allOccurrences(seed, new Date(NOW.getTime() - DAY), new Date(NOW.getTime() + 14 * DAY)), NOW)
    expect(next?.meeting.title).toBe('Brainstorm sprint')
    expect(occurrenceState(next!, NOW)).toBe('joinable')
  })

  it('covers past, today and later days', () => {
    const range = allOccurrences(seed, new Date(NOW.getTime() - 7 * DAY), new Date(NOW.getTime() + 14 * DAY))
    const labels = new Set(groupByDay(range, NOW).map((g) => g.label))
    expect(labels.has('Hari ini')).toBe(true)
    expect(labels.has('Besok')).toBe(true)
    expect(labels.has('Kemarin')).toBe(true)
  })
})

describe('matchDashboardShortcut', () => {
  class FakeElement {}
  beforeAll(() => vi.stubGlobal('HTMLElement', FakeElement))
  afterAll(() => vi.unstubAllGlobals())

  const key = (code: string, extra: Partial<KeyboardEvent> = {}, target: EventTarget | null = null) => ({
    code,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    repeat: false,
    target,
    ...extra,
  })

  it('maps N, J and S', () => {
    expect(matchDashboardShortcut(key('KeyN'))).toBe('instant')
    expect(matchDashboardShortcut(key('KeyJ'))).toBe('code')
    expect(matchDashboardShortcut(key('KeyS'))).toBe('schedule')
    expect(matchDashboardShortcut(key('KeyX'))).toBeNull()
  })

  it('ignores modified and repeated presses', () => {
    expect(matchDashboardShortcut(key('KeyN', { ctrlKey: true }))).toBeNull()
    expect(matchDashboardShortcut(key('KeyN', { shiftKey: true }))).toBeNull()
    expect(matchDashboardShortcut(key('KeyN', { repeat: true }))).toBeNull()
  })
})
