export type CameraQuality = 'low' | 'mid' | 'high'

export interface CameraQualityOption {
  readonly id: CameraQuality
  readonly label: string
  /** Resolution tag shown on the tile and in the menu */
  readonly resolution: string
  readonly fps: number
  /** Rough upstream bandwidth, for the menu hint */
  readonly bitrate: string
  readonly hint: string
  /** getUserMedia video constraints for when a real webcam is attached */
  readonly constraints: { readonly width: number; readonly height: number; readonly frameRate: number }
}

export const DEFAULT_CAMERA_QUALITY: CameraQuality = 'mid'

export const CAMERA_QUALITIES: readonly CameraQualityOption[] = [
  { id: 'low', label: 'Rendah', resolution: '360p', fps: 15, bitrate: '± 0,4 Mbps', hint: 'Hemat data. Cocok untuk koneksi lemah.', constraints: { width: 640, height: 360, frameRate: 15 } },
  { id: 'mid', label: 'Sedang', resolution: '720p', fps: 30, bitrate: '± 1,5 Mbps', hint: 'Seimbang untuk kebanyakan koneksi.', constraints: { width: 1280, height: 720, frameRate: 30 } },
  { id: 'high', label: 'Tinggi', resolution: '1080p', fps: 30, bitrate: '± 3 Mbps', hint: 'Paling tajam. Butuh koneksi stabil.', constraints: { width: 1920, height: 1080, frameRate: 30 } },
]

const BY_ID = new Map(CAMERA_QUALITIES.map((q) => [q.id, q]))

export function qualityOption(id: CameraQuality): CameraQualityOption {
  return BY_ID.get(id) ?? CAMERA_QUALITIES[1]
}

export function isCameraQuality(value: unknown): value is CameraQuality {
  return typeof value === 'string' && BY_ID.has(value as CameraQuality)
}

/** `getUserMedia({ video })` constraints for a quality; ideal values so weaker cameras still open. */
export function videoConstraintsFor(id: CameraQuality): MediaTrackConstraints {
  const { width, height, frameRate } = qualityOption(id).constraints
  return { width: { ideal: width }, height: { ideal: height }, frameRate: { ideal: frameRate } }
}

const STORAGE_KEY = 'huddle.cameraQuality'

/** Remembered choice, or the default. Storage can be unavailable (private windows), so every access is guarded. */
export function loadCameraQuality(): CameraQuality {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return isCameraQuality(stored) ? stored : DEFAULT_CAMERA_QUALITY
  } catch {
    return DEFAULT_CAMERA_QUALITY
  }
}

export function saveCameraQuality(id: CameraQuality) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // Not remembering the choice is harmless
  }
}
