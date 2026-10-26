import { useEffect, useRef, useState } from 'react'
import { backgroundKey, isEffectOn } from './backgrounds'
import type { BackgroundChoice } from './backgrounds'
import { createCompositor } from './compositor'
import type { Backdrop, Compositor } from './compositor'
import { loadFirstImage } from './loadImage'
import { loadSegmenter, nextTimestamp, personMaskIndex } from './segmenter'

export type EffectStatus = 'off' | 'loading' | 'ready' | 'error'
export type EffectFailure = 'model' | 'image' | 'slow' | null

export interface BackgroundEffect {
  /** What to show and send: the processed picture when it runs, the plain camera otherwise */
  readonly stream: MediaStream | null
  readonly status: EffectStatus
  readonly failure: EffectFailure
}

type Engine = { status: 'idle' | 'loading' | 'ready' | 'error'; failure: EffectFailure; stream: MediaStream | null }
type ImageState = 'idle' | 'loading' | 'ready' | 'error'

const IDLE: Engine = { status: 'idle', failure: null, stream: null }
const OUTPUT_FPS = 30
/** If a frame takes longer than this on average, the machine cannot keep up and the effect steps aside */
const SLOW_FRAME_MS = 75
const SLOW_AFTER_FRAMES = 45
const SMOOTHING = 0.15

function backdropFor(choice: BackgroundChoice, image: HTMLImageElement | null): Backdrop | null {
  if (choice.mode === 'blur') return { kind: 'blur', level: choice.level }
  if (choice.mode === 'image' && image) return { kind: 'image', image }
  return null
}

/**
 * Replaces or blurs everything but the person in a camera stream. The pipeline starts when an effect is first wanted
 * and keeps running while the choice changes between blur levels and pictures, so switching never blinks the preview.
 * `sources` are the addresses of the picture for an image choice.
 */
export function useBackgroundEffect(source: MediaStream | null, choice: BackgroundChoice, sources: readonly string[]): BackgroundEffect {
  const [engine, setEngine] = useState<Engine>(IDLE)
  const [imageState, setImageState] = useState<ImageState>('idle')
  const active = source !== null && isEffectOn(choice)

  const compositorRef = useRef<Compositor | null>(null)
  const choiceRef = useRef(choice)
  const imageRef = useRef<HTMLImageElement | null>(null)
  useEffect(() => {
    choiceRef.current = choice
  })

  // the pipeline: camera in, processed canvas out
  useEffect(() => {
    if (!source || !active) {
      setEngine(IDLE)
      return
    }
    let stopped = false
    let handle = 0
    let output: MediaStream | null = null
    let ready = false
    let frames = 0
    let average = 0
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.srcObject = source
    void video.play().catch(() => undefined)
    setEngine({ status: 'loading', failure: null, stream: null })

    const fail = (failure: EffectFailure) => {
      stopped = true
      setEngine({ status: 'error', failure, stream: null })
    }

    void loadSegmenter()
      .then((segmenter) => {
        if (stopped) return
        const compositor = createCompositor(backdropFor(choiceRef.current, imageRef.current))
        compositorRef.current = compositor
        output = compositor.canvas.captureStream(OUTPUT_FPS)
        const labels = segmenter.getLabels()

        const next = () => {
          if (stopped) return
          if ('requestVideoFrameCallback' in video) handle = video.requestVideoFrameCallback(step)
          else handle = requestAnimationFrame(step)
        }
        const step = () => {
          if (stopped) return
          if (video.readyState >= 2 && video.videoWidth > 0) {
            const started = performance.now()
            try {
              segmenter.segmentForVideo(video, nextTimestamp(), (result) => {
                const masks = result.confidenceMasks
                const mask = masks?.[personMaskIndex(labels, masks.length)]
                if (mask) compositor.draw(video, mask.getAsFloat32Array(), mask.width, mask.height)
              })
            } catch {
              fail('model')
              return
            }
            const took = performance.now() - started
            average = frames === 0 ? took : average + (took - average) * SMOOTHING
            frames += 1
            if (frames >= SLOW_AFTER_FRAMES && average > SLOW_FRAME_MS) {
              fail('slow')
              return
            }
            if (!ready && output) {
              ready = true
              setEngine({ status: 'ready', failure: null, stream: output })
            }
          }
          next()
        }
        next()
      })
      .catch(() => {
        if (!stopped) fail('model')
      })

    return () => {
      stopped = true
      if (handle) {
        if ('cancelVideoFrameCallback' in video) video.cancelVideoFrameCallback(handle)
        cancelAnimationFrame(handle)
      }
      output?.getTracks().forEach((track) => track.stop())
      video.pause()
      video.srcObject = null
      compositorRef.current = null
    }
  }, [source, active])

  // the backdrop: follows the choice without restarting the pipeline
  const key = `${backgroundKey(choice)}#${sources.join('|')}`
  useEffect(() => {
    let cancelled = false
    if (choice.mode === 'blur') {
      imageRef.current = null
      compositorRef.current?.setBackdrop({ kind: 'blur', level: choice.level })
      setImageState('idle')
      return
    }
    if (choice.mode === 'none') {
      imageRef.current = null
      setImageState('idle')
      return
    }
    setImageState('loading')
    if (sources.length > 0) {
      void loadFirstImage(sources)
        .then((image) => {
          if (cancelled) return
          imageRef.current = image
          compositorRef.current?.setBackdrop({ kind: 'image', image })
          setImageState('ready')
        })
        .catch(() => {
          if (!cancelled) setImageState('error')
        })
    }
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` already covers the choice and the sources
  }, [key])

  if (!active) return { stream: source, status: 'off', failure: null }
  if (engine.status === 'error') return { stream: source, status: 'error', failure: engine.failure }
  if (imageState === 'error') return { stream: engine.stream ?? source, status: 'error', failure: 'image' }
  const ready = engine.status === 'ready' && imageState !== 'loading'
  return { stream: engine.stream ?? source, status: ready ? 'ready' : 'loading', failure: null }
}
