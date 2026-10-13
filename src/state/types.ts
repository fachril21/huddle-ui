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

export type DockToggle = 'reaction' | 'soundboard' | 'more'

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

export interface HighFiveOffer {
  readonly id: number
  readonly fromId: string
  readonly startedAt: number
  readonly expiresAt: number
}

/** A matched pair whose animation is playing or waiting its turn (max 2 play at once). */
export interface HighFiveMatch {
  readonly id: number
  readonly aId: string
  readonly bId: string
}

/** Someone took an offer; late responders see "Sudah disambut ..." for a moment. */
export interface HighFiveClaim {
  readonly offerId: number
  readonly fromId: string
  readonly byId: string
  readonly at: number
}

export interface HighFiveState {
  readonly offers: readonly HighFiveOffer[]
  readonly matches: readonly HighFiveMatch[]
  readonly claims: readonly HighFiveClaim[]
  /** participant id -> performance.now() until which they cannot offer again */
  readonly cooldowns: Readonly<Record<string, number>>
}

export interface RoomState {
  readonly participants: readonly Participant[]
  readonly voice: Readonly<Record<string, VoiceSource>>
  readonly toggles: Readonly<Record<DockToggle, boolean>>
  readonly panel: PanelName | null
  readonly reactions: readonly ReactionItem[]
  readonly highFive: HighFiveState
  /** Participant currently sharing their screen, if any */
  readonly sharerId: string | null
}

export const SELF_ID = 'anda'
