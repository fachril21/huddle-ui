export type PaletteName = 'borealis' | 'nebula' | 'solstice' | 'abyss' | 'orchid' | 'verdant'

export type Role = 'Host' | 'Co-host' | 'Peserta' | 'Tamu'

export interface Participant {
  readonly id: string
  readonly name: string
  readonly role: Role
  readonly palette: PaletteName
  readonly camOn: boolean
  readonly micOn: boolean
}

/** Simulated voice source driven by the Demo Director. level is 0..1. */
export interface VoiceSource {
  readonly talking: boolean
  readonly level: number
  readonly natural: boolean
}

export type DockToggle =
  | 'share'
  | 'reaction'
  | 'hand'
  | 'highFive'
  | 'soundboard'
  | 'more'

export type PanelName = 'peserta' | 'chat' | 'polling' | 'host'

export interface RoomState {
  readonly participants: readonly Participant[]
  readonly voice: Readonly<Record<string, VoiceSource>>
  readonly toggles: Readonly<Record<DockToggle, boolean>>
  readonly panel: PanelName | null
}

export const SELF_ID = 'anda'
