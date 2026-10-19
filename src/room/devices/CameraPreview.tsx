import { VideoOff } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import type { MediaStatus } from '../../prejoin/mediaState'
import type { PaletteName } from '../../state/types'
import styles from './DevicePopover.module.css'

interface CameraPreviewProps {
  stream: MediaStream | null
  camOn: boolean
  status: MediaStatus
  palette: PaletteName
  /** The front camera is shown like a mirror; the back camera is not */
  mirrored: boolean
  onTurnOn: () => void
}

/** "1280×720" as the camera really delivers it, or null while no frames flow. */
function deliveredSize(stream: MediaStream | null): string | null {
  const { width, height } = stream?.getVideoTracks()[0]?.getSettings() ?? {}
  return width && height ? `${width}×${height}` : null
}

/** Live picture from the chosen camera. Off means no stream at all, so the camera light stays dark. */
export function CameraPreview({ stream, camOn, status, palette, mirrored, onTurnOn }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const showVideo = camOn && status === 'granted' && stream !== null
  const size = useMemo(() => deliveredSize(stream), [stream])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.srcObject = stream
    if (stream) void video.play().catch(() => undefined)
  }, [stream, showVideo])

  return (
    <div className={styles.preview} data-palette={palette}>
      {showVideo ? (
        <>
          <video ref={videoRef} data-mirrored={mirrored} muted playsInline aria-label="Pratinjau kamera Anda" />
          {size && <span className={`glass-1 ${styles.chip}`}>{size}</span>}
        </>
      ) : (
        <div className={styles.previewEmpty}>
          <span className={styles.previewIcon} aria-hidden="true">
            <VideoOff size={20} strokeWidth={1.75} />
          </span>
          {!camOn ? (
            <>
              <span>Kamera mati di meeting</span>
              <button type="button" className={styles.pill} onClick={onTurnOn}>
                Nyalakan kamera
              </button>
            </>
          ) : (
            <span role="status">{status === 'requesting' ? 'Membuka kamera…' : 'Kamera belum tersedia'}</span>
          )}
        </div>
      )}
    </div>
  )
}
