import { describe, expect, it } from 'vitest'
import { CAMERA_QUALITIES, DEFAULT_CAMERA_QUALITY, isCameraQuality, loadCameraQuality, qualityOption, videoConstraintsFor } from './cameraQuality'

describe('camera quality', () => {
  it('orders the options from lightest to sharpest', () => {
    const heights = CAMERA_QUALITIES.map((q) => q.constraints.height)
    expect(heights).toEqual([...heights].sort((a, b) => a - b))
    expect(CAMERA_QUALITIES.map((q) => q.id)).toEqual(['low', 'mid', 'high'])
  })

  it('maps each quality to ideal getUserMedia constraints', () => {
    expect(videoConstraintsFor('low')).toEqual({ width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 15 } })
    expect(videoConstraintsFor('high')).toEqual({ width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } })
  })

  it('looks options up by id', () => {
    expect(qualityOption('mid').resolution).toBe('720p')
  })

  it('validates stored values', () => {
    expect(isCameraQuality('low')).toBe(true)
    expect(isCameraQuality('ultra')).toBe(false)
    expect(isCameraQuality(null)).toBe(false)
  })

  it('falls back to the default when storage is unavailable', () => {
    expect(loadCameraQuality()).toBe(DEFAULT_CAMERA_QUALITY)
  })
})
