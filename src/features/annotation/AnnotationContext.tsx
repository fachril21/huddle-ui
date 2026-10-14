import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Dispatch } from 'react'
import type { RoomAction } from '../../state/roomReducer'
import { SELF_ID } from '../../state/types'
import type { AnnotationColor, AnnotationTool, Participant, RoomState, Stroke } from '../../state/types'

/** Drawing tools plus the eraser, which removes whole strokes instead of adding one. */
export type AnnotationMode = AnnotationTool | 'eraser'

/** Strokes drawn while "Hilang otomatis" is on fade after this long; the laser always fades quickly. */
export const VANISH_MS = 4000
export const LASER_MS = 900

export interface AnnotationController {
  strokes: readonly Stroke[]
  people: readonly Participant[]
  /** Anyone may draw: a screen is being shared and the host allows it (host and co-host always may) */
  enabled: boolean
  /** The host switch is off, so a participant cannot draw */
  blockedByHost: boolean
  canManage: boolean
  annotating: boolean
  mode: AnnotationMode
  color: AnnotationColor
  vanish: boolean
  setAnnotating: (on: boolean) => void
  toggleAnnotating: () => void
  setMode: (mode: AnnotationMode) => void
  setColor: (color: AnnotationColor) => void
  setVanish: (on: boolean) => void
  addStroke: (points: readonly number[]) => void
  eraseStroke: (id: number) => void
  undo: () => void
  clear: () => void
}

const AnnotationContext = createContext<AnnotationController | null>(null)
export const AnnotationProvider = AnnotationContext.Provider

export function useAnnotation(): AnnotationController {
  const ctx = useContext(AnnotationContext)
  if (!ctx) throw new Error('useAnnotation must be used inside an AnnotationProvider')
  return ctx
}

/** Owns the local drawing tool state and turns user gestures into reducer actions. */
export function useAnnotationController(state: RoomState, dispatch: Dispatch<RoomAction>, canManage: boolean): AnnotationController {
  const [annotating, setAnnotating] = useState(false)
  const [mode, setMode] = useState<AnnotationMode>('pen')
  const [color, setColor] = useState<AnnotationColor>('blue')
  const [vanish, setVanish] = useState(false)

  const sharing = state.sharerId !== null
  const { allowed, strokes } = state.annotation
  const enabled = sharing && (allowed || canManage)
  const blockedByHost = sharing && !allowed && !canManage

  // Leaving the share, or losing the right to draw, ends drawing mode
  useEffect(() => {
    if (!enabled) setAnnotating(false)
  }, [enabled])

  // Esc leaves drawing mode
  useEffect(() => {
    if (!annotating) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      setAnnotating(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [annotating])

  // Laser and vanishing ink need their expiry swept
  const hasFading = strokes.some((s) => s.fadeAfterMs !== null)
  useEffect(() => {
    if (!hasFading) return
    const id = window.setInterval(() => dispatch({ type: 'annotationExpire', now: performance.now() }), 500)
    return () => window.clearInterval(id)
  }, [hasFading, dispatch])

  const addStroke = useCallback(
    (points: readonly number[]) => {
      if (mode === 'eraser' || points.length < 2) return
      const fadeAfterMs = mode === 'laser' ? LASER_MS : vanish ? VANISH_MS : null
      dispatch({ type: 'annotationAdd', stroke: { authorId: SELF_ID, tool: mode, color, points, startedAt: performance.now(), durationMs: 0, fadeAfterMs } })
    },
    [dispatch, mode, color, vanish],
  )
  const eraseStroke = useCallback((id: number) => dispatch({ type: 'annotationErase', id, byId: SELF_ID }), [dispatch])
  const undo = useCallback(() => dispatch({ type: 'annotationUndo', byId: SELF_ID }), [dispatch])
  const clear = useCallback(() => dispatch({ type: 'annotationClear', byId: SELF_ID }), [dispatch])
  const toggleAnnotating = useCallback(() => setAnnotating((on) => !on), [])
  const people = useMemo(() => [...state.participants, ...state.bench], [state.participants, state.bench])

  return useMemo(
    () => ({ strokes, people, enabled, blockedByHost, canManage, annotating, mode, color, vanish, setAnnotating, toggleAnnotating, setMode, setColor, setVanish, addStroke, eraseStroke, undo, clear }),
    [strokes, people, enabled, blockedByHost, canManage, annotating, mode, color, vanish, toggleAnnotating, addStroke, eraseStroke, undo, clear],
  )
}
