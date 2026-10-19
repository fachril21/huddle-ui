import { useCallback, useEffect, useState } from 'react'
import type { Devices, DeviceOption } from '../prejoin/useMediaPreview'

const EMPTY: Devices = { cameras: [], mics: [], speakers: [] }

function options(list: readonly MediaDeviceInfo[], kind: MediaDeviceKind, fallback: string): DeviceOption[] {
  return list.filter((d) => d.kind === kind && d.deviceId !== '').map((d, i) => ({ id: d.deviceId, label: d.label || `${fallback} ${i + 1}` }))
}

export interface DeviceList {
  readonly devices: Devices
  /** The browser hides device names until the page has been allowed to use the camera or mic once */
  readonly namesHidden: boolean
  /** The person said no (or there is nothing to allow) when asked to show the names */
  readonly blocked: boolean
  /** Ask once so the names appear; the stream is dropped straight away */
  readonly reveal: () => Promise<void>
}

/** The devices this browser can see, kept current when something is plugged in or out. */
export function useDeviceList(): DeviceList {
  const [devices, setDevices] = useState<Devices>(EMPTY)
  const [namesHidden, setNamesHidden] = useState(false)
  const [blocked, setBlocked] = useState(false)

  const refresh = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    const all = await navigator.mediaDevices.enumerateDevices()
    setDevices({
      cameras: options(all, 'videoinput', 'Kamera'),
      mics: options(all, 'audioinput', 'Mikrofon'),
      speakers: options(all, 'audiooutput', 'Speaker'),
    })
    const real = all.filter((d) => d.deviceId !== '' && d.kind !== 'audiooutput')
    setNamesHidden(real.length > 0 && real.every((d) => d.label === ''))
  }, [])

  useEffect(() => {
    void refresh().catch(() => undefined)
    const media = navigator.mediaDevices
    if (!media?.addEventListener) return
    const onChange = () => void refresh().catch(() => undefined)
    media.addEventListener('devicechange', onChange)
    return () => media.removeEventListener('devicechange', onChange)
  }, [refresh])

  const reveal = useCallback(async () => {
    setBlocked(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      stream.getTracks().forEach((t) => t.stop())
      await refresh()
    } catch {
      setBlocked(true)
    }
  }, [refresh])

  return { devices, namesHidden, blocked, reveal }
}
