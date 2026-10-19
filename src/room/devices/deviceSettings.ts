export type DeviceKind = 'camera' | 'mic' | 'speaker'

/** Front (user) or back (environment) camera; only used while no specific camera is picked. */
export type CameraFacing = 'user' | 'environment'

/** Which devices the user chose. An empty id means "follow the system default". */
export interface DeviceSettings {
  readonly cameraId: string
  readonly micId: string
  readonly speakerId: string
  readonly facing: CameraFacing
}

export const DEFAULT_DEVICES: DeviceSettings = { cameraId: '', micId: '', speakerId: '', facing: 'user' }

const FIELD: Record<DeviceKind, 'cameraId' | 'micId' | 'speakerId'> = { camera: 'cameraId', mic: 'micId', speaker: 'speakerId' }

export function withDevice(devices: DeviceSettings, kind: DeviceKind, id: string): DeviceSettings {
  return devices[FIELD[kind]] === id ? devices : { ...devices, [FIELD[kind]]: id }
}

/** Switch between the front and back camera. Any specific camera pick is dropped so the facing mode decides. */
export function flipFacing(devices: DeviceSettings): DeviceSettings {
  return { ...devices, cameraId: '', facing: devices.facing === 'user' ? 'environment' : 'user' }
}

/**
 * True when a chosen device has vanished from the list (unplugged). An empty list means the browser has not
 * revealed devices yet, so it proves nothing.
 */
export function isMissing(chosenId: string, available: readonly { readonly id: string }[]): boolean {
  return chosenId !== '' && available.length > 0 && !available.some((d) => d.id === chosenId)
}
