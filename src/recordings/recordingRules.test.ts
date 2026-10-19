import { describe, expect, it } from 'vitest'
import { closingRecordingNote } from '../room/ClosingScreen'
import { recordingReducer } from './recordingStore'
import { stopReasonOnLeave } from './useRecordingSync'
import type { Recording } from './types'

const live: Recording = {
  id: 'r1',
  title: 'Rapat',
  code: 'abc-defg-hij',
  hostName: 'Fachril',
  participants: ['Fachril'],
  startedAt: '2026-10-19T10:00:00Z',
  stoppedAt: null,
  stopReason: null,
  durationSec: 0,
  sizeMb: 0,
  status: 'recording',
}

describe('when the last person leaves', () => {
  it('stops the recording by itself', () => {
    expect(stopReasonOnLeave('left', 0)).toBe('room-empty')
  })

  it('keeps recording while someone else is still in the room', () => {
    expect(stopReasonOnLeave('left', 3)).toBeNull()
  })

  it('ends it when the host ends the meeting, whoever is left', () => {
    expect(stopReasonOnLeave('ended', 3)).toBe('meeting-ended')
  })
})

describe('recordingReducer', () => {
  it('starts the 24 hour clock only when it stops, and keeps the reason', () => {
    const started = recordingReducer([], { type: 'start', recording: live })
    expect(started[0].stoppedAt).toBeNull()
    const stopped = recordingReducer(started, { type: 'stop', id: 'r1', reason: 'room-empty', at: '2026-10-19T11:00:00Z' })
    expect(stopped[0]).toMatchObject({ stoppedAt: '2026-10-19T11:00:00Z', stopReason: 'room-empty', status: 'processing' })
  })

  it('does not restart a recording that already stopped', () => {
    const stopped = recordingReducer([live], { type: 'stop', id: 'r1', reason: 'host-stopped', at: '2026-10-19T11:00:00Z' })
    const again = recordingReducer(stopped, { type: 'stop', id: 'r1', reason: 'room-empty', at: '2026-10-19T12:00:00Z' })
    expect(again[0].stopReason).toBe('host-stopped')
    expect(again[0].stoppedAt).toBe('2026-10-19T11:00:00Z')
  })

  it('removes a recording', () => {
    expect(recordingReducer([live], { type: 'remove', id: 'r1' })).toEqual([])
  })
})

describe('closingRecordingNote', () => {
  it('says nothing when nothing was recorded', () => {
    expect(closingRecordingNote('left', false, 0)).toBeNull()
  })

  it('explains the automatic stop for the last person', () => {
    expect(closingRecordingNote('left', true, 0)).toContain('berhenti otomatis')
  })

  it('says it keeps going when others remain', () => {
    expect(closingRecordingNote('left', true, 2)).toContain('masih berjalan')
  })
})
