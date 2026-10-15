import { useEffect, useRef } from 'react'
import { Aurora } from '../tile/Aurora'
import { useFx } from '../room/MotionContext'
import type { MediaStatus } from './mediaState'
import type { MicLevel } from './useMicLevel'
import styles from './PreviewStage.module.css'

interface PreviewStageProps {
  videoStream: MediaStream | null
  camOn: boolean
  cameraStatus: MediaStatus
  micOn: boolean
  name: string
  mic: MicLevel
}

/** Level (0..1) to the CSS variables the shared Aurora and the edge glow read. */
function applyLevel(el: HTMLElement, level: number) {
  el.style.setProperty('--aurora-o', String(level < 0.02 ? 0.12 : 0.25 + level * 0.45))
  el.style.setProperty('--ring-o', String(level))
  el.style.setProperty('--blob-s', String(0.6 + level * 0.4))
  el.style.setProperty('--glow-o', String(Math.min(0.8, level)))
}

/** Caption when there is no picture, so a dark stage never looks broken. */
function emptyCaption(camOn: boolean, status: MediaStatus): string {
  if (!camOn) return 'Kamera mati'
  if (status === 'requesting') return 'Menunggu izin kamera…'
  if (status === 'granted') return ''
  return 'Kamera belum tersedia'
}

/** The full-bleed mirror: camera if there is one, otherwise the initial on an aurora that answers the voice. */
export function PreviewStage({ videoStream, camOn, cameraStatus, micOn, name, mic }: PreviewStageProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { subscribe } = mic
  const { fx, reduced } = useFx()
  const showVideo = camOn && cameraStatus === 'granted' && videoStream !== null

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.srcObject = videoStream
    if (videoStream) void video.play().catch(() => undefined)
  }, [videoStream, showVideo])

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    applyLevel(el, 0)
    return subscribe((level) => applyLevel(el, micOn ? level : 0))
  }, [subscribe, micOn])

  const initial = name.trim().charAt(0).toUpperCase() || 'T'
  const caption = emptyCaption(camOn, cameraStatus)

  return (
    <div ref={stageRef} className={styles.stage} data-palette="borealis" data-cam={showVideo ? 'on' : 'off'} data-motion={reduced ? 'reduced' : 'full'}>
      {showVideo ? (
        <video ref={videoRef} className={styles.video} muted playsInline aria-label="Pratinjau kamera Anda" />
      ) : (
        <div className={styles.empty}>
          {fx !== 'off' && (
            <div className={styles.auroraArea}>
              <Aurora thin={fx === 'lite'} />
            </div>
          )}
          <div className={styles.avatar} aria-hidden="true">
            <span>{initial}</span>
          </div>
          <p className={styles.caption} role="status">
            {caption}
          </p>
        </div>
      )}
      <div className={styles.edge} aria-hidden="true" />
      <div className={styles.shade} aria-hidden="true" />
    </div>
  )
}
