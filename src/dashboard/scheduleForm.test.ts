import { describe, expect, it } from 'vitest'
import { entryAction } from './entryAction'
import { filterOccurrences } from './meetingFilter'
import { occurrencesBetween } from './schedule'
import { buildResult, defaultStart, initialForm, validateForm } from './scheduleForm'
import type { IdSource } from './scheduleForm'
import type { Meeting } from './types'

const NOW = new Date('2026-10-15T03:42:00Z') // 10:42 WIB
const ids: IdSource = { newId: () => 'new-id', newCode: () => 'nnn-nnnn-nnn' }

const weekly: Meeting = {
  id: 'w1',
  code: 'abc-defg-hij',
  title: 'Review desain',
  description: '',
  startsAt: '2026-10-08T08:00:00.000Z', // Thu 15:00 WIB
  durationMin: 45,
  timezone: 'Asia/Jakarta',
  recurrence: 'weekly',
  invitees: ['maya@huddle.id'],
  hostName: 'Fachril',
  isHost: true,
  security: { passcode: null, waitingRoom: false, muteOnJoin: false },
  cancelled: false,
  skipped: [],
}
const session = (m: Meeting) => occurrencesBetween(m, new Date('2026-10-15T00:00:00Z'), new Date('2026-10-16T00:00:00Z'))[0]

describe('defaultStart', () => {
  it('lands on the next half hour at least 15 minutes away, in WIB', () => {
    expect(defaultStart(NOW)).toEqual({ date: '2026-10-15', time: '11:00' })
    expect(defaultStart(new Date('2026-10-15T03:10:00Z'))).toEqual({ date: '2026-10-15', time: '10:30' })
    expect(defaultStart(new Date('2026-10-15T16:50:00Z'))).toEqual({ date: '2026-10-16', time: '00:30' })
  })
})

describe('create', () => {
  it('starts valid once a title is typed', () => {
    const blank = initialForm('create', NOW)
    expect(validateForm(blank, 'create', NOW, false).title).toBeDefined()
    expect(validateForm({ ...blank, title: 'Rapat' }, 'create', NOW, false)).toEqual({})
  })

  it('builds a hosted meeting with a fresh code, or Room saya', () => {
    const form = { ...initialForm('create', NOW), title: '  Sprint   planning ' }
    const auto = buildResult('create', form, undefined, ids)
    expect(auto.kind).toBe('create')
    expect(auto.meeting).toMatchObject({ id: 'new-id', code: 'nnn-nnnn-nnn', title: 'Sprint planning', isHost: true, hostName: 'Fachril', recurrence: 'none' })
    expect(auto.meeting.startsAt).toBe('2026-10-15T04:00:00.000Z')
    const mine = buildResult('create', { ...form, room: 'mine' }, undefined, ids)
    expect(mine.meeting.code).toBe('fcr-hilz-uld')
  })

  it('keeps the passcode only when switched on', () => {
    const form = { ...initialForm('create', NOW), title: 'x', passcode: '654321' }
    expect(buildResult('create', { ...form, passcodeOn: true }, undefined, ids).meeting.security.passcode).toBe('654321')
    expect(buildResult('create', { ...form, passcodeOn: false }, undefined, ids).meeting.security.passcode).toBeNull()
  })
})

describe('edit a repeating meeting', () => {
  const source = { meeting: weekly, occurrence: session(weekly) }

  it('prefills from the session and defaults to this session only', () => {
    const form = initialForm('edit', NOW, source)
    expect(form).toMatchObject({ date: '2026-10-15', time: '15:00', scope: 'single', title: 'Review desain' })
  })

  it('this session only: a one-off meeting replaces it and leaves the series alone', () => {
    const form = { ...initialForm('edit', NOW, source), time: '16:30' }
    const result = buildResult('edit', form, source, ids)
    expect(result.kind).toBe('single')
    if (result.kind !== 'single') return
    expect(result.startIso).toBe('2026-10-15T08:00:00.000Z')
    expect(result.meeting).toMatchObject({ id: 'new-id', recurrence: 'none', startsAt: '2026-10-15T09:30:00.000Z', code: 'abc-defg-hij' })
  })

  it('whole series: keeps the first date, changes the time of day', () => {
    const form = { ...initialForm('edit', NOW, source), scope: 'series' as const, time: '16:30' }
    const result = buildResult('edit', form, source, ids)
    expect(result.kind).toBe('series')
    expect(result.meeting.startsAt).toBe('2026-10-08T09:30:00.000Z')
    expect(result.meeting.id).toBe('w1')
  })

  it('whole series: a time already past today is not an error', () => {
    const form = { ...initialForm('edit', NOW, source), scope: 'series' as const, time: '09:00' }
    expect(validateForm(form, 'edit', NOW, true).when).toBeUndefined()
    expect(validateForm({ ...form, scope: 'single' }, 'edit', NOW, true).when).toBeDefined()
  })
})

describe('duplicate', () => {
  it('copies the details but starts at the next free slot with a new code', () => {
    const source = { meeting: weekly, occurrence: session(weekly) }
    const form = initialForm('duplicate', NOW, source)
    expect(form).toMatchObject({ title: 'Review desain', date: '2026-10-15', time: '11:00' })
    const result = buildResult('duplicate', form, source, ids)
    expect(result.kind).toBe('create')
    expect(result.meeting).toMatchObject({ id: 'new-id', code: 'nnn-nnnn-nnn' })
  })
})

describe('entryAction', () => {
  it('says Join for everyone, whenever the link is opened', () => {
    expect(entryAction('joinable')).toEqual({ label: 'Join', variant: 'primary', enabled: true })
    expect(entryAction('live')).toEqual({ label: 'Join', variant: 'primary', enabled: true })
  })

  it('keeps Join available before the session window, only quieter', () => {
    expect(entryAction('upcoming')).toEqual({ label: 'Join', variant: 'secondary', enabled: true })
  })

  it('offers no way into an ended session', () => {
    expect(entryAction('ended')).toBeNull()
  })
})

describe('filterOccurrences', () => {
  const mine = session(weekly)
  const theirs = session({ ...weekly, id: 'w2', title: 'Demo klien', isHost: false, hostName: 'Maya', invitees: [] })
  const list = [mine, theirs]

  it('matches title, code, host and invitee names, ignoring case and padding', () => {
    expect(filterOccurrences(list, '  DEMO ', 'all')).toEqual([theirs])
    expect(filterOccurrences(list, 'abc-defg', 'all')).toHaveLength(2)
    expect(filterOccurrences(list, 'maya', 'all')).toHaveLength(2) // invitee on one, host on the other
    expect(filterOccurrences(list, 'tidak ada', 'all')).toEqual([])
  })

  it('narrows by role', () => {
    expect(filterOccurrences(list, '', 'host')).toEqual([mine])
    expect(filterOccurrences(list, '', 'invited')).toEqual([theirs])
  })
})
