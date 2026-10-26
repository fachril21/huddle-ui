import { blurRadius } from './backgrounds'
import type { BlurLevel } from './backgrounds'
import { coverRect } from './uploadRules'

/** The output is never wider than this; a 1080p camera is shrunk so the effect keeps up on ordinary laptops */
export const MAX_EFFECT_WIDTH = 1280
/** The blurred layer is drawn this much smaller and stretched back, which is both the blur's cheapest part and its softest */
const BLUR_DOWNSCALE = 4
/** How much of the previous mask is kept, so the edge does not shimmer from frame to frame */
const MASK_MEMORY = 0.45
const EDGE_LOW = 0.35
const EDGE_HIGH = 0.65
const FALLBACK_FILL = '#0b1020'
const EDGE_FEATHER_PX = 1.5

export type Backdrop =
  | { readonly kind: 'blur'; readonly level: BlurLevel }
  | { readonly kind: 'image'; readonly image: HTMLImageElement }

export interface Compositor {
  readonly canvas: HTMLCanvasElement
  setBackdrop: (backdrop: Backdrop) => void
  /** `mask` holds, per pixel, how sure the model is that it is the person (0 to 1) */
  draw: (video: HTMLVideoElement, mask: Float32Array, maskWidth: number, maskHeight: number) => void
}

function surface(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D tidak tersedia')
  return { canvas, ctx }
}

function supportsFilter(ctx: CanvasRenderingContext2D): boolean {
  return typeof ctx.filter === 'string'
}

function softEdge(confidence: number): number {
  const t = (confidence - EDGE_LOW) / (EDGE_HIGH - EDGE_LOW)
  return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t)
}

/** Draws camera frames over a replaced background: the person is cut out with the model's mask, everything else is swapped. */
export function createCompositor(initial: Backdrop | null): Compositor {
  const out = surface()
  const person = surface()
  const mask = surface()
  const small = surface()
  const layer = surface()
  const canFilter = supportsFilter(out.ctx)

  let backdrop = initial
  let layerStale = true
  let smoothed: Float32Array | null = null
  let maskImage: ImageData | null = null

  const resize = (width: number, height: number) => {
    for (const s of [out, person, layer]) {
      s.canvas.width = width
      s.canvas.height = height
    }
    small.canvas.width = Math.max(1, Math.round(width / BLUR_DOWNSCALE))
    small.canvas.height = Math.max(1, Math.round(height / BLUR_DOWNSCALE))
    layerStale = true
  }

  const paintImageLayer = (image: HTMLImageElement) => {
    const { width, height } = layer.canvas
    const { sx, sy, sw, sh } = coverRect(image.naturalWidth, image.naturalHeight, width, height)
    layer.ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height)
  }

  const paintBackdrop = (video: HTMLVideoElement) => {
    const { width, height } = out.canvas
    out.ctx.globalCompositeOperation = 'source-over'
    if (backdrop?.kind === 'image') {
      if (layerStale) {
        paintImageLayer(backdrop.image)
        layerStale = false
      }
      out.ctx.drawImage(layer.canvas, 0, 0)
      return
    }
    if (backdrop?.kind === 'blur') {
      const radius = blurRadius(backdrop.level, height) / BLUR_DOWNSCALE
      // drawn slightly past the canvas edge, so the blur has real picture to sample there instead of darkening the rim
      const pad = Math.ceil(radius * 1.5)
      small.ctx.filter = canFilter ? `blur(${radius}px)` : 'none'
      small.ctx.drawImage(video, -pad, -pad, small.canvas.width + pad * 2, small.canvas.height + pad * 2)
      small.ctx.filter = 'none'
      out.ctx.imageSmoothingQuality = 'high'
      out.ctx.drawImage(small.canvas, 0, 0, width, height)
      return
    }
    out.ctx.fillStyle = FALLBACK_FILL
    out.ctx.fillRect(0, 0, width, height)
  }

  const updateMask = (confidence: Float32Array, width: number, height: number) => {
    if (mask.canvas.width !== width || mask.canvas.height !== height) {
      mask.canvas.width = width
      mask.canvas.height = height
      maskImage = mask.ctx.createImageData(width, height)
      smoothed = null
    }
    if (!maskImage) return
    const pixels = maskImage.data
    const prev = smoothed && smoothed.length === confidence.length ? smoothed : null
    const next = prev ?? new Float32Array(confidence.length)
    for (let i = 0; i < confidence.length; i += 1) {
      const value = prev ? prev[i] * MASK_MEMORY + confidence[i] * (1 - MASK_MEMORY) : confidence[i]
      next[i] = value
      const o = i * 4
      pixels[o] = 255
      pixels[o + 1] = 255
      pixels[o + 2] = 255
      pixels[o + 3] = Math.round(softEdge(value) * 255)
    }
    smoothed = next
    mask.ctx.putImageData(maskImage, 0, 0)
  }

  const draw: Compositor['draw'] = (video, confidence, maskWidth, maskHeight) => {
    const scale = Math.min(1, MAX_EFFECT_WIDTH / video.videoWidth)
    const width = Math.max(2, Math.round(video.videoWidth * scale))
    const height = Math.max(2, Math.round(video.videoHeight * scale))
    if (out.canvas.width !== width || out.canvas.height !== height) resize(width, height)

    updateMask(confidence, maskWidth, maskHeight)
    paintBackdrop(video)

    // the person: the camera frame, kept only where the mask says so, with a hair of feathering on the edge
    person.ctx.globalCompositeOperation = 'source-over'
    person.ctx.clearRect(0, 0, width, height)
    person.ctx.drawImage(video, 0, 0, width, height)
    person.ctx.globalCompositeOperation = 'destination-in'
    person.ctx.imageSmoothingQuality = 'high'
    // the mask is a few hundred pixels wide; feathering by about half a mask pixel hides its steps
    if (canFilter) person.ctx.filter = `blur(${Math.max(EDGE_FEATHER_PX, (width / maskWidth) * 0.6)}px)`
    person.ctx.drawImage(mask.canvas, 0, 0, width, height)
    person.ctx.filter = 'none'
    out.ctx.drawImage(person.canvas, 0, 0)
  }

  return {
    canvas: out.canvas,
    setBackdrop: (next) => {
      backdrop = next
      layerStale = true
    },
    draw,
  }
}
