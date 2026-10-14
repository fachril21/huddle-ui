import type { AnnotationColor, Stroke } from '../state/types'

export type DoodleKind = 'circle' | 'underline' | 'arrow'

const STEPS = 28

function circle(): number[] {
  const points: number[] = []
  for (let i = 0; i <= STEPS; i++) {
    const t = (i / STEPS) * Math.PI * 2.1
    points.push(0.72 + Math.cos(t) * 0.12, 0.42 + Math.sin(t) * 0.17)
  }
  return points
}

function underline(): number[] {
  const points: number[] = []
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS
    points.push(0.2 + t * 0.4, 0.3 + Math.sin(t * Math.PI * 3) * 0.006 + t * 0.012)
  }
  return points
}

function arrow(): number[] {
  const shaft: number[] = []
  for (let i = 0; i <= 14; i++) {
    const t = i / 14
    shaft.push(0.3 + t * 0.28, 0.78 - t * 0.2)
  }
  // arrow head: back along both wings
  return [...shaft, 0.52, 0.56, 0.58, 0.58, 0.55, 0.64]
}

const SHAPES: Readonly<Record<DoodleKind, () => number[]>> = { circle, underline, arrow }
export const DOODLE_KINDS: readonly DoodleKind[] = ['circle', 'underline', 'arrow']

/** A ready-made scribble drawn progressively by someone else, for the Demo Director and the scenarios. */
export function doodleStroke(kind: DoodleKind, authorId: string, color: AnnotationColor, now: number, fadeAfterMs: number | null = null): Omit<Stroke, 'id'> {
  return { authorId, tool: kind === 'underline' ? 'highlighter' : 'pen', color, points: SHAPES[kind](), startedAt: now, durationMs: 1400, fadeAfterMs }
}
