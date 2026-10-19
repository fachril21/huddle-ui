import { useCallback, useMemo, useReducer } from 'react'
import { buildRecordings } from './seed'
import type { Recording, StopReason } from './types'

const REMOVED_KEY = 'huddle.recordings.removed.v1'

export type RecordingAction =
  | { type: 'start'; recording: Recording }
  | { type: 'tick'; id: string; durationSec: number; sizeMb: number }
  | { type: 'stop'; id: string; reason: StopReason; at: string }
  | { type: 'remove'; id: string }

export function recordingReducer(state: readonly Recording[], action: RecordingAction): readonly Recording[] {
  switch (action.type) {
    case 'start':
      return [action.recording, ...state]
    case 'tick':
      return state.map((r) => (r.id === action.id && r.stoppedAt === null ? { ...r, durationSec: action.durationSec, sizeMb: action.sizeMb } : r))
    case 'stop':
      return state.map((r) =>
        r.id === action.id && r.stoppedAt === null ? { ...r, stoppedAt: action.at, stopReason: action.reason, status: 'processing' as const } : r,
      )
    case 'remove':
      return state.filter((r) => r.id !== action.id)
  }
}

function loadRemoved(): string[] {
  try {
    const data: unknown = JSON.parse(window.localStorage.getItem(REMOVED_KEY) ?? '[]')
    return Array.isArray(data) ? data.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function rememberRemoved(id: string) {
  try {
    window.localStorage.setItem(REMOVED_KEY, JSON.stringify([...new Set([...loadRemoved(), id])]))
  } catch {
    // The deletion just won't survive a reload
  }
}

export interface RecordingStore {
  readonly recordings: readonly Recording[]
  readonly start: (recording: Recording) => void
  readonly tick: (id: string, durationSec: number, sizeMb: number) => void
  readonly stop: (id: string, reason: StopReason, at: Date) => void
  readonly remove: (id: string) => void
}

/** Recordings for the whole app. Samples are rebuilt around "now" on every load; only deletions are remembered. */
export function useRecordings(): RecordingStore {
  const [recordings, dispatch] = useReducer(recordingReducer, undefined, () => {
    const removed = new Set(loadRemoved())
    return buildRecordings(new Date()).filter((r) => !removed.has(r.id))
  })

  const start = useCallback((recording: Recording) => dispatch({ type: 'start', recording }), [])
  const tick = useCallback((id: string, durationSec: number, sizeMb: number) => dispatch({ type: 'tick', id, durationSec, sizeMb }), [])
  const stop = useCallback((id: string, reason: StopReason, at: Date) => dispatch({ type: 'stop', id, reason, at: at.toISOString() }), [])
  const remove = useCallback((id: string) => {
    rememberRemoved(id)
    dispatch({ type: 'remove', id })
  }, [])

  return useMemo(() => ({ recordings, start, tick, stop, remove }), [recordings, start, tick, stop, remove])
}
