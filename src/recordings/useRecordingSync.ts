import { useEffect, useRef } from 'react'
import type { JoinTarget } from '../dashboard/types'
import { SELF_ID } from '../state/types'
import type { RoomState } from '../state/types'
import type { RecordingStore } from './recordingStore'
import type { StopReason } from './types'

const TICK_MS = 1000
/** Rough size growth of a 720p recording */
const MB_PER_SEC = 0.19

/** The reason a recording stops when the user leaves: with nobody else in the room it stops by itself. */
export function stopReasonOnLeave(phase: 'left' | 'ended' | 'removed', othersInRoom: number): StopReason | null {
  if (phase === 'ended') return 'meeting-ended'
  return othersInRoom === 0 ? 'room-empty' : null
}

/**
 * Mirrors the room's recording into the Rekaman list: a row appears when the host starts, grows while it records,
 * and is closed when the host stops, the meeting ends, or the last person leaves.
 */
export function useRecordingSync(state: RoomState, target: JoinTarget | null, joined: boolean, store: RecordingStore) {
  const activeId = useRef<string | null>(null)
  const startedAt = useRef(0)
  const latest = useRef({ state, target, store, joined })
  useEffect(() => {
    latest.current = { state, target, store, joined }
  })

  const recording = state.host.recording !== 'off'
  const phase = state.phase
  const othersInRoom = state.participants.filter((p) => p.id !== SELF_ID).length

  // a row opens when recording starts inside a room the user joined
  useEffect(() => {
    if (!joined || !recording || activeId.current || phase !== 'live' || !latest.current.target) return
    const { target: t, store: s } = latest.current
    const now = new Date()
    const id = `rec-live-${now.getTime()}`
    activeId.current = id
    startedAt.current = now.getTime()
    s.start({
      id,
      title: t.title,
      code: t.code,
      hostName: t.hostName,
      participants: [t.hostName, ...latest.current.state.participants.map((p) => p.name).filter((n) => n !== t.hostName)].slice(0, 8),
      startedAt: now.toISOString(),
      stoppedAt: null,
      stopReason: null,
      durationSec: 0,
      sizeMb: 0,
      status: 'recording',
    })
  }, [joined, recording, phase])

  // it grows while it records (a pause still keeps the row open, the clock just stops)
  useEffect(() => {
    if (!activeId.current || state.host.recording !== 'on') return
    const id = window.setInterval(() => {
      const sec = Math.round((Date.now() - startedAt.current) / 1000)
      if (activeId.current) latest.current.store.tick(activeId.current, sec, Math.max(1, Math.round(sec * MB_PER_SEC)))
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [state.host.recording, joined])

  // the host stopped it; if the demo was restarted instead, the meeting simply ended
  useEffect(() => {
    if (recording || !activeId.current) return
    latest.current.store.stop(activeId.current, latest.current.joined ? 'host-stopped' : 'meeting-ended', new Date())
    activeId.current = null
  }, [recording])

  // the user left or the host ended the meeting
  useEffect(() => {
    if (phase === 'live' || !activeId.current) return
    const reason = stopReasonOnLeave(phase, othersInRoom)
    if (!reason) return
    latest.current.store.stop(activeId.current, reason, new Date())
    activeId.current = null
  }, [phase, othersInRoom])
}
