import { useCallback, useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { AnnotationColor, Stroke } from '../../state/types'
import { SELF_ID } from '../../state/types'
import { useAnnotation } from './AnnotationContext'
import { appendPoint, LABEL_MS, strokeAlpha, strokeEndsAt, strokeHit, visiblePairs } from './annotationMath'
import styles from './AnnotationLayer.module.css'

const ERASER_RADIUS = 0.03
const INK_UNDERLAY = 'rgba(6, 9, 18, 0.35)'
const LABEL_INK = '#060912'

interface Ink {
  readonly colors: Readonly<Record<AnnotationColor, string>>
}

/** Resolve the ink colours from the design tokens once the layer is on screen. */
function readInk(): Ink {
  const style = getComputedStyle(document.documentElement)
  const pick = (name: string, fallback: string) => style.getPropertyValue(`--aurora-${name}`).trim() || fallback
  return { colors: { rose: pick('rose', '#ff5c85'), blue: pick('blue', '#3d7bff'), violet: pick('violet', '#8b7bff'), amber: pick('amber', '#ffb84d') } }
}

function tracePath(ctx: CanvasRenderingContext2D, points: readonly number[], pairs: number, w: number, h: number) {
  ctx.beginPath()
  ctx.moveTo(points[0] * w, points[1] * h)
  if (pairs === 1) ctx.lineTo(points[0] * w + 0.01, points[1] * h)
  for (let i = 1; i < pairs; i++) ctx.lineTo(points[i * 2] * w, points[i * 2 + 1] * h)
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Pick<Stroke, 'points' | 'tool' | 'color' | 'startedAt' | 'durationMs' | 'fadeAfterMs'>, ink: Ink, w: number, h: number, now: number) {
  const alpha = strokeAlpha(stroke, now)
  if (alpha <= 0 || stroke.points.length < 2) return
  const pairs = visiblePairs(stroke, now)
  const scale = w / 960
  const color = ink.colors[stroke.color]
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalAlpha = alpha
  if (stroke.tool === 'highlighter') {
    ctx.globalAlpha = alpha * 0.4
    ctx.strokeStyle = color
    ctx.lineWidth = 16 * scale
    tracePath(ctx, stroke.points, pairs, w, h)
    ctx.stroke()
  } else if (stroke.tool === 'laser') {
    ctx.strokeStyle = color
    ctx.lineWidth = 4 * scale
    ctx.shadowColor = color
    ctx.shadowBlur = 12 * scale
    tracePath(ctx, stroke.points, pairs, w, h)
    ctx.stroke()
  } else {
    // a dark underlay keeps thin ink readable on any shared screen
    ctx.strokeStyle = INK_UNDERLAY
    ctx.lineWidth = 3.4 * scale + 2.5
    tracePath(ctx, stroke.points, pairs, w, h)
    ctx.stroke()
    ctx.strokeStyle = color
    ctx.lineWidth = 3.4 * scale
    tracePath(ctx, stroke.points, pairs, w, h)
    ctx.stroke()
  }
  ctx.restore()
}

/** Name tag next to the end of someone's latest stroke, so everyone knows who is drawing. */
function drawLabel(ctx: CanvasRenderingContext2D, name: string, color: string, x: number, y: number, alpha: number, w: number, h: number) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.font = '600 11px "Plus Jakarta Sans", system-ui, sans-serif'
  const padX = 7
  const width = ctx.measureText(name).width + padX * 2
  const left = Math.min(Math.max(4, x + 10), w - width - 4)
  const top = Math.min(Math.max(4, y + 10), h - 22)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(left, top, width, 18, 9)
  ctx.fill()
  ctx.fillStyle = LABEL_INK
  ctx.textBaseline = 'middle'
  ctx.fillText(name, left + padX, top + 9.5)
  ctx.restore()
}

/**
 * Canvas over the shared screen. Everyone sees the ink; the pointer is captured only while the user is in drawing mode.
 * Coordinates are normalised to the screen box, so the picture survives any layout change.
 */
export function AnnotationLayer() {
  const { strokes, people, annotating, mode, color, canManage, addStroke, eraseStroke } = useAnnotation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inkRef = useRef<Ink | null>(null)
  const draft = useRef<number[]>([])
  const drawing = useRef(false)
  const erased = useRef(new Set<number>())
  const frame = useRef(0)
  const latest = useRef({ strokes, people, mode, color })
  latest.current = { strokes, people, mode, color }

  const render = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    inkRef.current ??= readInk()
    const ink = inkRef.current
    const dpr = window.devicePixelRatio || 1
    const w = canvas.width / dpr
    const h = canvas.height / dpr
    const now = performance.now()
    const { strokes: list, people: crowd, mode: tool, color: tint } = latest.current
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    for (const stroke of list) drawStroke(ctx, stroke, ink, w, h, now)

    // name tag at the end of each other person's latest stroke
    const lastByAuthor = new Map<string, Stroke>()
    for (const stroke of list) lastByAuthor.set(stroke.authorId, stroke)
    for (const [authorId, stroke] of lastByAuthor) {
      const age = now - strokeEndsAt(stroke)
      if (authorId === SELF_ID || age > LABEL_MS) continue
      const pairs = visiblePairs(stroke, now)
      const name = crowd.find((p) => p.id === authorId)?.name
      if (!name) continue
      drawLabel(ctx, name, ink.colors[stroke.color], stroke.points[pairs * 2 - 2] * w, stroke.points[pairs * 2 - 1] * h, Math.min(1, (LABEL_MS - age) / 500) * strokeAlpha(stroke, now), w, h)
    }

    if (drawing.current && tool !== 'eraser' && draft.current.length >= 2) {
      drawStroke(ctx, { points: draft.current, tool, color: tint, startedAt: now, durationMs: 0, fadeAfterMs: null }, ink, w, h, now)
    }
  }, [])

  // Redraw every frame only while something moves: a gesture, a reveal, a fade or a lingering name tag
  const loop = useCallback(() => {
    cancelAnimationFrame(frame.current)
    const tick = () => {
      render()
      const now = performance.now()
      const busy = drawing.current || latest.current.strokes.some((s) => s.fadeAfterMs !== null || now < strokeEndsAt(s) + LABEL_MS)
      if (busy) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
  }, [render])

  useEffect(() => {
    loop()
    return () => cancelAnimationFrame(frame.current)
  }, [strokes, annotating, loop])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(([entry]) => {
      const dpr = window.devicePixelRatio || 1
      const { width, height } = entry.contentRect
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      loop()
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [loop])

  const toPoint = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height, aspect: rect.width / rect.height }
  }

  const eraseAt = (x: number, y: number, aspect: number) => {
    for (const stroke of latest.current.strokes) {
      if (erased.current.has(stroke.id) || (stroke.authorId !== SELF_ID && !canManage)) continue
      if (strokeHit(stroke, x, y, ERASER_RADIUS, aspect)) {
        erased.current.add(stroke.id)
        eraseStroke(stroke.id)
      }
    }
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!annotating || e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const { x, y, aspect } = toPoint(e)
    drawing.current = true
    draft.current = []
    erased.current.clear()
    if (mode === 'eraser') eraseAt(x, y, aspect)
    else appendPoint(draft.current, x, y)
    loop()
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const { x, y, aspect } = toPoint(e)
    if (mode === 'eraser') eraseAt(x, y, aspect)
    else appendPoint(draft.current, x, y)
  }

  const finish = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    drawing.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    if (mode !== 'eraser') addStroke(draft.current.slice())
    draft.current = []
    loop()
  }

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      data-active={annotating}
      data-mode={mode}
      aria-hidden="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
    />
  )
}
