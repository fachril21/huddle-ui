import { describe, expect, it } from 'vitest'
import { expiresAt, formatDuration, formatRemaining, formatSize, groupRecordings, phaseOf, RETENTION_MS, TRACE_MS, urgencyOf } from './retention'
import type { Recording } from './types'

const NOW = new Date('2026-10-19T12:00:00Z')
const HOUR = 3_600_000

function rec(patch: Partial<Recording> = {}): Recording {
  return {
    id: 'r',
    title: 'Rapat',
    code: 'abc-defg-hij',
    hostName: 'Fachril',
    participants: ['Fachril'],
    startedAt: '2026-10-19T10:00:00Z',
    stoppedAt: '2026-10-19T11:00:00Z',
    stopReason: 'host-stopped',
    durationSec: 3600,
    sizeMb: 300,
    status: 'ready',
    ...patch,
  }
}

const stoppedAgo = (ms: number) => new Date(NOW.getTime() - ms).toISOString()

describe('recording lifetime', () => {
  it('has no expiry while it is still recording', () => {
    expect(expiresAt({ stoppedAt: null })).toBeNull()
    expect(phaseOf(rec({ stoppedAt: null, stopReason: null, status: 'recording' }), NOW)).toBe('live')
  })

  it('expires exactly 24 hours after it stopped', () => {
    const r = rec({ stoppedAt: '2026-10-19T11:00:00Z' })
    expect(expiresAt(r)?.toISOString()).toBe('2026-10-20T11:00:00.000Z')
  })

  it('is ready until the 24 hour mark and an expired trace right after', () => {
    expect(phaseOf(rec({ stoppedAt: stoppedAgo(RETENTION_MS - 1) }), NOW)).toBe('ready')
    expect(phaseOf(rec({ stoppedAt: stoppedAgo(RETENTION_MS) }), NOW)).toBe('expired')
  })

  it('forgets the trace after 7 more days', () => {
    expect(phaseOf(rec({ stoppedAt: stoppedAgo(RETENTION_MS + TRACE_MS - 1) }), NOW)).toBe('expired')
    expect(phaseOf(rec({ stoppedAt: stoppedAgo(RETENTION_MS + TRACE_MS) }), NOW)).toBe('gone')
  })

  it('is processing only briefly after stopping', () => {
    expect(phaseOf(rec({ status: 'processing', stoppedAt: stoppedAgo(30_000) }), NOW)).toBe('processing')
    expect(phaseOf(rec({ status: 'processing', stoppedAt: stoppedAgo(10 * 60_000) }), NOW)).toBe('ready')
  })
})

describe('urgency', () => {
  it('is calm above 12 hours, soon from 12 hours, urgent from 3 hours', () => {
    expect(urgencyOf(12 * HOUR + 1)).toBe('calm')
    expect(urgencyOf(12 * HOUR)).toBe('soon')
    expect(urgencyOf(3 * HOUR + 1)).toBe('soon')
    expect(urgencyOf(3 * HOUR)).toBe('urgent')
  })
})

describe('formatting', () => {
  it('writes the time left in hours and minutes, then minutes only', () => {
    expect(formatRemaining(18 * HOUR + 20 * 60_000)).toBe('18j 20m')
    expect(formatRemaining(45 * 60_000)).toBe('45 mnt')
    expect(formatRemaining(30_000)).toBe('Kurang dari 1 mnt')
    expect(formatRemaining(0)).toBe('Habis')
  })

  it('writes durations and sizes', () => {
    expect(formatDuration(272)).toBe('04:32')
    expect(formatDuration(3909)).toBe('1:05:09')
    expect(formatSize(480)).toBe('480 MB')
    expect(formatSize(1250)).toBe('1,3 GB')
  })
})

describe('groupRecordings', () => {
  it('puts the soonest to be deleted first, and drops what is gone', () => {
    const older = rec({ id: 'older', stoppedAt: stoppedAgo(20 * HOUR) })
    const newer = rec({ id: 'newer', stoppedAt: stoppedAgo(2 * HOUR) })
    const trace = rec({ id: 'trace', stoppedAt: stoppedAgo(RETENTION_MS + HOUR) })
    const gone = rec({ id: 'gone', stoppedAt: stoppedAgo(RETENTION_MS + TRACE_MS + HOUR) })
    const live = rec({ id: 'live', stoppedAt: null, stopReason: null, status: 'recording' })
    const groups = groupRecordings([newer, gone, trace, older, live], NOW)
    expect(groups.live.map((r) => r.id)).toEqual(['live'])
    expect(groups.active.map((r) => r.id)).toEqual(['older', 'newer'])
    expect(groups.traces.map((r) => r.id)).toEqual(['trace'])
  })
})
