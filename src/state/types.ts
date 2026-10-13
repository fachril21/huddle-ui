export type PaletteName = 'borealis' | 'nebula' | 'solstice' | 'abyss' | 'orchid' | 'verdant'

export type Role = 'Host' | 'Co-host' | 'Peserta' | 'Tamu'

export type PresenceStatus = 'none' | 'afk' | 'brb'

export type ConnectionState = 'good' | 'poor' | 'reconnecting'

export interface Participant {
  readonly id: string
  readonly name: string
  readonly role: Role
  readonly palette: PaletteName
  readonly camOn: boolean
  readonly micOn: boolean
  /** Raise-hand queue position (1 = first), null when the hand is down */
  readonly hand: number | null
  readonly status: PresenceStatus
  readonly connection: ConnectionState
}

/** Simulated voice source driven by the Demo Director. level is 0..1. */
export interface VoiceSource {
  readonly talking: boolean
  readonly level: number
  readonly natural: boolean
}

export type DockToggle = 'share' | 'reaction' | 'highFive' | 'soundboard' | 'more'

export type PanelName = 'peserta' | 'chat' | 'polling' | 'host'

export type ReactionName =
  | 'thumbs-up'
  | 'clap'
  | 'heart'
  | 'party'
  | 'laugh'
  | 'surprised'
  | 'thanks'
  | 'fire'

/** A floating reaction. Consecutive identical reactions from one sender merge into count. */
export interface ReactionItem {
  readonly id: number
  readonly senderId: string
  readonly name: ReactionName
  readonly count: number
  /** horizontal offset from the left edge, 24-200px */
  readonly x: number
  readonly createdAt: number
  readonly updatedAt: number
}

export interface RoomState {
  readonly participants: readonly Participant[]
  readonly voice: Readonly<Record<string, VoiceSource>>
  readonly toggles: Readonly<Record<DockToggle, boolean>>
  readonly panel: PanelName | null
  readonly reactions: readonly ReactionItem[]
}

export const SELF_ID = 'anda'
