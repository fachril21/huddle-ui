import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SPEAKING_THRESHOLD, levelFromRms, rmsFromBytes, smoothLevel } from './micLevel'

type LevelListener = (level: number) => void

export interface MicLevel {
  /** Call `listener` every animation frame with the smoothed 0..1 level; returns the unsubscribe. */
  subscribe: (listener: LevelListener) => () => void
  /** True once a voice has crossed the speaking threshold since the stream started. */
  heardSignal: boolean
}

/** Frames above the threshold before the mic counts as "heard"; ignores a single click or pop. */
const HEARD_FRAMES = 6

/**
 * Reads the live input level from a mic stream with an AnalyserNode. Level goes to subscribers
 * imperatively (no React render per frame); only `heardSignal` is React state.
 */
export function useMicLevel(stream: MediaStream | null): MicLevel {
  const listeners = useRef(new Set<LevelListener>())
  const [heard, setHeard] = useState(false)

  useEffect(() => {
    setHeard(false)
    if (!stream || stream.getAudioTracks().length === 0) {
      for (const l of listeners.current) l(0)
      return
    }
    const Ctor = window.AudioContext
    if (!Ctor) return
    const ctx = new Ctor()
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 1024
    source.connect(analyser)
    const buffer = new Uint8Array(analyser.fftSize)

    let level = 0
    let loud = 0
    let raf = 0
    const tick = () => {
      analyser.getByteTimeDomainData(buffer)
      level = smoothLevel(level, levelFromRms(rmsFromBytes(buffer)))
      loud = level > SPEAKING_THRESHOLD ? loud + 1 : 0
      if (loud === HEARD_FRAMES) setHeard(true)
      for (const l of listeners.current) l(level)
      raf = requestAnimationFrame(tick)
    }
    void ctx.resume().catch(() => undefined)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      source.disconnect()
      void ctx.close().catch(() => undefined)
      for (const l of listeners.current) l(0)
    }
  }, [stream])

  const subscribe = useCallback((listener: LevelListener) => {
    listeners.current.add(listener)
    return () => {
      listeners.current.delete(listener)
    }
  }, [])

  return useMemo(() => ({ subscribe, heardSignal: heard }), [subscribe, heard])
}
