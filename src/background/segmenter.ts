import type { ImageSegmenter } from '@mediapipe/tasks-vision'

const BASE = import.meta.env.BASE_URL
const WASM_PATH = `${BASE}mediapipe/wasm`
const MODEL_PATH = `${BASE}models/selfie_segmenter.tflite`

let pending: Promise<ImageSegmenter> | null = null
let lastTimestamp = 0

/** MediaPipe wants strictly rising timestamps across every call on one segmenter, even from different previews. */
export function nextTimestamp(): number {
  lastTimestamp = Math.max(performance.now(), lastTimestamp + 1)
  return lastTimestamp
}

async function create(): Promise<ImageSegmenter> {
  // loaded on demand so the ~150 KB of code and the model cost nothing until someone picks an effect
  const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision')
  const fileset = await FilesetResolver.forVisionTasks(WASM_PATH)
  const make = (delegate: 'GPU' | 'CPU') =>
    ImageSegmenter.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_PATH, delegate },
      runningMode: 'VIDEO',
      outputConfidenceMasks: true,
      outputCategoryMask: false,
    })
  try {
    return await make('GPU')
  } catch {
    return make('CPU')
  }
}

/** One shared segmenter for the whole page. A failed load is forgotten so the next try starts clean. */
export function loadSegmenter(): Promise<ImageSegmenter> {
  pending ??= create().catch((error: unknown) => {
    pending = null
    throw error
  })
  return pending
}

/** Which mask holds "this is the person". Falls back to the last one, which is the foreground for two-class models. */
export function personMaskIndex(labels: readonly string[], maskCount: number): number {
  const named = labels.findIndex((label) => /person|foreground|selfie|human/i.test(label))
  if (named >= 0 && named < maskCount) return named
  return Math.max(0, maskCount - 1)
}
