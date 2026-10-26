import type { BackgroundChoice } from '../background/backgrounds'
import type { CameraQuality } from '../room/cameraQuality'
import type { DeviceSettings } from '../room/devices/deviceSettings'

export type PaletteName = 'borealis' | 'nebula' | 'solstice' | 'abyss' | 'orchid' | 'verdant'

export type Role = 'Host' | 'Co-host' | 'Peserta' | 'Tamu'

export type PresenceStatus = 'none' | 'afk' | 'brb'

export type ConnectionState = 'good' | 'poor' | 'reconnecting'

/** Visual effects tier (Design.md 19.1): Penuh, Hemat, Mati */
export type FxTier = 'full' | 'lite' | 'off'

/** Someone who stepped away: since when, when they said they would be back, and what their mic and camera were. */
export interface Away {
  /** performance.now() when they went */
  readonly since: number
  /** BRB only: when they said they would be back, null if they did not say */
  readonly backAt: number | null
  /** Mic and camera as they were, to be restored on return; null when the status left them alone */
  readonly before: { readonly micOn: boolean; readonly camOn: boolean } | null
}

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
  /** Present while status is not 'none' */
  readonly away?: Away
  readonly connection: ConnectionState
}

/** Simulated voice source driven by the Demo Director. level is 0..1. */
export interface VoiceSource {
  readonly talking: boolean
  readonly level: number
  readonly natural: boolean
}

export type DockToggle = 'reaction' | 'soundboard' | 'more' | 'mic' | 'camera' | 'leave'

export type PanelName = 'peserta' | 'chat' | 'polling' | 'ruang' | 'host'

export type ReactionName = 'thumbs-up' | 'clap' | 'heart' | 'party' | 'laugh' | 'surprised' | 'thanks' | 'fire'

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

/** A soundboard sound someone played; shown as a chip and an equalizer on their tile while it lasts. */
export interface SoundPlay {
  readonly id: number
  readonly fromId: string
  readonly soundId: string
  readonly startedAt: number
  readonly durationMs: number
}

export interface SoundboardState {
  /** Host switch "Izinkan soundboard" */
  readonly allowed: boolean
  readonly plays: readonly SoundPlay[]
  /** participant id -> performance.now() of their last play (3s global cooldown per sender) */
  readonly lastPlayAt: Readonly<Record<string, number>>
}

export interface PollOption {
  readonly id: string
  readonly text: string
}

export interface Poll {
  readonly id: number
  readonly question: string
  readonly options: readonly PollOption[]
  readonly multiple: boolean
  readonly anonymous: boolean
  readonly liveResults: boolean
  /** null = manual close */
  readonly autoCloseS: number | null
  readonly status: 'active' | 'closed'
  readonly startedAt: number
  readonly creatorId: string
  /** voter id -> chosen option ids (identities are never shown on anonymous polls) */
  readonly votes: Readonly<Record<string, readonly string[]>>
}

export interface ChatMessage {
  readonly id: number
  readonly fromId: string
  /** null = public; otherwise a private message to this participant */
  readonly toId: string | null
  readonly text: string
  /** People this message was meant for who were away when it was sent (the recipient, or an @mention) */
  readonly awayIds?: readonly string[]
  /** seconds on the mock meeting clock (see formatChatTime) */
  readonly at: number
  /** The Ruang diskusi it was said in; missing means the main room */
  readonly roomId?: string
}

export interface ChatState {
  readonly messages: readonly ChatMessage[]
  /** who is typing right now, if anyone */
  readonly typingId: string | null
  /** number of messages already seen; the rest count as unread */
  readonly readCount: number
}

export interface Guest {
  readonly id: string
  readonly name: string
  /** When the guest asked to come in (performance.now), for "menunggu 0:42" */
  readonly at: number
}

export type RecordingState = 'off' | 'on' | 'paused'

export interface HostState {
  readonly locked: boolean
  /** Six-digit key needed to claim the host role when nobody holds it (Co-hosts skip it) */
  readonly hostKey: string
  readonly restrictShare: boolean
  readonly recording: RecordingState
  /** Non-hosts must agree once to be recorded */
  readonly consented: boolean
  /** Guests must be let in by a host or co-host. Off means anyone with the link walks in. */
  readonly waitingRoom: boolean
  readonly waiting: readonly Guest[]
  readonly announcement: { readonly id: number; readonly text: string } | null
}

export type AnnotationTool = 'pen' | 'highlighter' | 'laser'

/** Ink colours that stay readable on both light and dark shared screens */
export type AnnotationColor = 'rose' | 'blue' | 'violet' | 'amber'

/** One scribble on the shared screen. Points are normalised to the screen (0..1), so layout changes never break them. */
export interface Stroke {
  readonly id: number
  readonly authorId: string
  readonly tool: AnnotationTool
  readonly color: AnnotationColor
  /** Flat list x0, y0, x1, y1, ... */
  readonly points: readonly number[]
  /** performance.now() when the stroke began */
  readonly startedAt: number
  /** Reveal time for strokes drawn by other people (0 = drawn instantly) */
  readonly durationMs: number
  /** Fade away this long after the stroke ends; null keeps it until the share stops */
  readonly fadeAfterMs: number | null
}

export interface AnnotationState {
  /** Host switch "Izinkan anotasi" for everyone who is not host or co-host */
  readonly allowed: boolean
  readonly strokes: readonly Stroke[]
}

/** The main room is not a breakout room, so it has no entry in `rooms` */
export const MAIN_ROOM = 'main'

export interface BreakoutRoom {
  readonly id: string
  readonly name: string
}

/** off: nothing set up. prepared: rooms exist but are closed. open: people are in them. closing: the wrap-up countdown. */
export type BreakoutPhase = 'off' | 'prepared' | 'open' | 'closing'

/** How people get to a room: spread evenly, placed by hand, or they pick */
export type BreakoutMode = 'auto' | 'manual' | 'choice'

export interface BreakoutOptions {
  /** Move assigned people in without asking them to press Masuk */
  readonly autoMove: boolean
  /** People may go back to the main room whenever they like */
  readonly allowReturn: boolean
  /** Close the rooms by themselves after this many minutes, null = only by hand */
  readonly autoCloseMin: number | null
  /** Show everyone the time left */
  readonly showTimer: boolean
}

export interface HelpRequest {
  readonly roomId: string
  readonly byId: string
  readonly at: number
}

export interface BreakoutState {
  readonly phase: BreakoutPhase
  readonly mode: BreakoutMode
  readonly rooms: readonly BreakoutRoom[]
  /** Where each person is placed. Missing or null = not placed (stays in the main room). */
  readonly assignment: Readonly<Record<string, string | null>>
  /** Where each person actually is right now. Missing = the main room. */
  readonly where: Readonly<Record<string, string>>
  readonly options: BreakoutOptions
  /** performance.now() when the rooms opened */
  readonly openedAt: number | null
  /** When the auto-close timer runs out */
  readonly closesAt: number | null
  /** When the 60 s wrap-up ends and everyone is back in the main room */
  readonly closingEndsAt: number | null
  readonly help: readonly HelpRequest[]
  /** The host's last message to every room */
  readonly broadcast: { readonly id: number; readonly text: string; readonly at: number } | null
}

export interface Notice {
  readonly id: number
  readonly text: string
  readonly at: number
}

/** live = in the room; left = the user left; ended = the host ended it for everyone */
export type Phase = 'live' | 'left' | 'ended' | 'removed'

/** Galeri = tile grid, Pembicara = active speaker big with a filmstrip, Sorotan = pinned (or speaking) person with a side strip */
export type LayoutMode = 'gallery' | 'speaker' | 'spotlight'

export interface LayoutSettings {
  readonly mode: LayoutMode
  /** Person pinned in Sorotan */
  readonly pinnedId: string | null
  readonly hideNoVideo: boolean
}

export interface Settings {
  readonly fx: FxTier
  readonly cameraQuality: CameraQuality
  /** Chosen camera, microphone and speaker; empty ids follow the system default */
  readonly devices: DeviceSettings
  /** What sits behind the person on camera */
  readonly background: BackgroundChoice
  readonly layout: LayoutSettings
  readonly simulateReduced: boolean
}

export interface RoomState {
  /** Participants currently in the room, in display order */
  readonly participants: readonly Participant[]
  /** Participants not in the room (outside the 4/8/12 selection or removed by the host) */
  readonly bench: readonly Participant[]
  readonly voice: Readonly<Record<string, VoiceSource>>
  readonly toggles: Readonly<Record<DockToggle, boolean>>
  readonly panel: PanelName | null
  readonly reactions: readonly ReactionItem[]
  readonly highFive: HighFiveState
  /** Participant currently sharing their screen, if any */
  readonly sharerId: string | null
  readonly soundboard: SoundboardState
  /** Newest first. polls[0] is the active poll while its status is active. */
  readonly polls: readonly Poll[]
  readonly chat: ChatState
  readonly annotation: AnnotationState
  readonly breakout: BreakoutState
  readonly host: HostState
  readonly notices: readonly Notice[]
  readonly phase: Phase
  readonly settings: Settings
}

export const SELF_ID = 'anda'
