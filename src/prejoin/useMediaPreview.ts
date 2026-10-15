import { useCallback, useEffect, useMemo, useState } from 'react'
import { videoConstraintsFor } from '../room/cameraQuality'
import type { CameraQuality } from '../room/cameraQuality'
import { statusFromError } from './mediaState'
import type { MediaStatus } from './mediaState'

export interface DeviceOption {
  readonly id: string
  readonly label: string
}

export interface Devices {
  readonly cameras: readonly DeviceOption[]
  readonly mics: readonly DeviceOption[]
  readonly speakers: readonly DeviceOption[]
}

const NO_DEVICES: Devices = { cameras: [], mics: [], speakers: [] }

interface Options {
  camOn: boolean
  micOn: boolean
  quality: CameraQuality
  cameraId: string
  micId: string
  /** Front (user) or back (environment) camera; only used while no specific camera is picked */
  facing?: 'user' | 'environment'
}

export interface MediaPreview {
  videoStream: MediaStream | null
  audioStream: MediaStream | null
  cameraStatus: MediaStatus
  micStatus: MediaStatus
  devices: Devices
  /** Ask again for a kind after a recoverable failure */
  retry: (kind: 'camera' | 'mic') => void
}

function toOptions(list: readonly MediaDeviceInfo[], kind: MediaDeviceKind, fallback: string): DeviceOption[] {
  return list
    .filter((d) => d.kind === kind && d.deviceId !== '')
    .map((d, i) => ({ id: d.deviceId, label: d.label || `${fallback} ${i + 1}` }))
}

function stopAll(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop())
}

/**
 * Real camera and mic for the lobby. Each kind is requested on its own so a refused camera never
 * takes the mic down with it. Turning a toggle off stops its tracks, so the camera light goes out.
 */
export function useMediaPreview({ camOn, micOn, quality, cameraId, micId, facing }: Options): MediaPreview {
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [cameraStatus, setCameraStatus] = useState<MediaStatus>('idle')
  const [micStatus, setMicStatus] = useState<MediaStatus>('idle')
  const [devices, setDevices] = useState<Devices>(NO_DEVICES)
  const [attempt, setAttempt] = useState({ camera: 0, mic: 0 })

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    try {
      const list = await navigator.mediaDevices.enumerateDevices()
      setDevices({
        cameras: toOptions(list, 'videoinput', 'Kamera'),
        mics: toOptions(list, 'audioinput', 'Mikrofon'),
        speakers: toOptions(list, 'audiooutput', 'Speaker'),
      })
    } catch {
      setDevices(NO_DEVICES)
    }
  }, [])

  useEffect(() => {
    void refreshDevices()
    const md = navigator.mediaDevices
    if (!md?.addEventListener) return
    md.addEventListener('devicechange', refreshDevices)
    return () => md.removeEventListener('devicechange', refreshDevices)
  }, [refreshDevices])

  useEffect(() => {
    if (!camOn) {
      setVideoStream(null)
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      // A missing API means an insecure page or old browser, not missing hardware
      setCameraStatus('error')
      return
    }
    let cancelled = false
    let acquired: MediaStream | null = null
    setCameraStatus('requesting')
    const video: MediaTrackConstraints = { ...videoConstraintsFor(quality), ...(cameraId ? { deviceId: { exact: cameraId } } : facing ? { facingMode: { ideal: facing } } : {}) }
    navigator.mediaDevices
      .getUserMedia({ video })
      .then((stream) => {
        if (cancelled) return stopAll(stream)
        acquired = stream
        stream.getTracks()[0]?.addEventListener('ended', () => {
          if (cancelled) return
          setVideoStream(null)
          setCameraStatus('no-device')
        })
        setVideoStream(stream)
        setCameraStatus('granted')
        void refreshDevices()
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setVideoStream(null)
        setCameraStatus(statusFromError(error))
      })
    return () => {
      cancelled = true
      stopAll(acquired)
    }
  }, [camOn, quality, cameraId, facing, attempt.camera, refreshDevices])

  useEffect(() => {
    if (!micOn) {
      setAudioStream(null)
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicStatus('error')
      return
    }
    let cancelled = false
    let acquired: MediaStream | null = null
    setMicStatus('requesting')
    const audio: MediaTrackConstraints = { echoCancellation: true, noiseSuppression: true, ...(micId ? { deviceId: { exact: micId } } : {}) }
    navigator.mediaDevices
      .getUserMedia({ audio })
      .then((stream) => {
        if (cancelled) return stopAll(stream)
        acquired = stream
        stream.getTracks()[0]?.addEventListener('ended', () => {
          if (cancelled) return
          setAudioStream(null)
          setMicStatus('no-device')
        })
        setAudioStream(stream)
        setMicStatus('granted')
        void refreshDevices()
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setAudioStream(null)
        setMicStatus(statusFromError(error))
      })
    return () => {
      cancelled = true
      stopAll(acquired)
    }
  }, [micOn, micId, attempt.mic, refreshDevices])

  // A device that was unplugged comes back: try it again without asking the user
  useEffect(() => {
    if (camOn && cameraStatus === 'no-device' && devices.cameras.length > 0) setAttempt((a) => ({ ...a, camera: a.camera + 1 }))
    if (micOn && micStatus === 'no-device' && devices.mics.length > 0) setAttempt((a) => ({ ...a, mic: a.mic + 1 }))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to the device list only; statuses are read, not triggers
  }, [devices])

  const retry = useCallback((kind: 'camera' | 'mic') => setAttempt((a) => ({ ...a, [kind]: a[kind] + 1 })), [])

  return useMemo(() => ({ videoStream, audioStream, cameraStatus, micStatus, devices, retry }), [videoStream, audioStream, cameraStatus, micStatus, devices, retry])
}
