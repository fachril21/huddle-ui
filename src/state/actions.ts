import type { CameraQuality } from '../room/cameraQuality'
import type { DeviceKind, DeviceSettings } from '../room/devices/deviceSettings'
import type {
  ConnectionState,
  DockToggle,
  FxTier,
  LayoutMode,
  Guest,
  PanelName,
  Phase,
  Poll,
  PresenceStatus,
  ReactionName,
  Role,
  Stroke,
  VoiceSource,
} from './types'

export type VoicePreset = 'silence' | 'solo' | 'crowd'

export type RoomAction =
  // participants
  | { type: 'toggleMic'; id: string }
  | { type: 'setMic'; id: string; on: boolean }
  | { type: 'toggleCam'; id: string }
  | { type: 'moveParticipant'; id: string; toIndex: number }
  | { type: 'swapParticipants'; a: string; b: string }
  | { type: 'toggleHand'; id: string }
  | { type: 'toggleStatus'; id: string; status: Exclude<PresenceStatus, 'none'> }
  | { type: 'toggleConnection'; id: string; connection: Exclude<ConnectionState, 'good'> }
  | { type: 'setCount'; count: number }
  | { type: 'setRole'; id: string; role: Role }
  | { type: 'makeHost'; id: string }
  | { type: 'claimHost'; id: string; key: string; now: number }
  | { type: 'vacateHost'; now: number }
  | { type: 'removeParticipant'; id: string; now: number }
  | { type: 'muteAll'; now: number }
  // chrome
  | { type: 'toggleDock'; key: DockToggle }
  | { type: 'closeDock'; key: DockToggle }
  | { type: 'togglePanel'; panel: PanelName }
  | { type: 'openPanel'; panel: PanelName | null }
  // voice (Demo Director)
  | { type: 'patchVoice'; id: string; patch: Partial<VoiceSource> }
  | { type: 'applyVoicePreset'; preset: VoicePreset }
  // reactions
  | { type: 'react'; senderId: string; name: ReactionName; x: number; now: number }
  | { type: 'expireReactions'; now: number }
  // high five
  | { type: 'hfOffer'; fromId: string; now: number }
  | { type: 'hfCancel'; fromId: string }
  | { type: 'hfRespond'; fromId: string; byId: string; now: number }
  | { type: 'hfTick'; now: number }
  | { type: 'hfMatchDone'; id: number }
  // share screen
  | { type: 'startShare'; id: string }
  | { type: 'stopShare' }
  // soundboard
  | { type: 'sbPlay'; fromId: string; soundId: string; durationMs: number; now: number }
  | { type: 'sbExpire'; now: number }
  | { type: 'sbAllow'; on: boolean }
  // polls
  | { type: 'pollStart'; poll: Omit<Poll, 'id' | 'status' | 'votes'> }
  | { type: 'pollVote'; voterId: string; optionIds: readonly string[] }
  | { type: 'pollClose' }
  | { type: 'pollTick'; now: number }
  // chat
  | { type: 'chatSend'; fromId: string; toId: string | null; text: string; now: number }
  | { type: 'chatTyping'; id: string | null }
  | { type: 'chatRead' }
  // annotation on the shared screen
  | { type: 'annotationAdd'; stroke: Omit<Stroke, 'id'> }
  | { type: 'annotationErase'; id: number; byId: string }
  | { type: 'annotationUndo'; byId: string }
  | { type: 'annotationClear'; byId: string }
  | { type: 'annotationAllow'; on: boolean }
  | { type: 'annotationExpire'; now: number }
  // host tools
  | { type: 'hostLock'; on: boolean; now: number }
  | { type: 'hostRestrictShare'; on: boolean }
  | { type: 'hostRecording'; state: 'on' | 'paused' | 'off' }
  | { type: 'recordingConsent' }
  | { type: 'guestRequest'; guest: Guest }
  | { type: 'guestDecide'; id: string; admit: boolean; now: number }
  | { type: 'guestAdmitAll'; now: number }
  | { type: 'hostWaitingRoom'; on: boolean; now: number }
  | { type: 'announce'; text: string }
  | { type: 'dismissAnnouncement' }
  // notices
  | { type: 'notice'; text: string; now: number }
  | { type: 'expireNotices'; now: number }
  // session
  | { type: 'leave'; phase: Exclude<Phase, 'live'> }
  | { type: 'reset' }
  | { type: 'setFx'; fx: FxTier }
  | { type: 'setCameraQuality'; quality: CameraQuality }
  | { type: 'setDevice'; kind: DeviceKind; id: string }
  | { type: 'flipCamera' }
  | { type: 'joinRoom'; name: string; micOn: boolean; camOn: boolean; quality: CameraQuality; devices: DeviceSettings }
  | { type: 'setLayoutMode'; mode: LayoutMode }
  | { type: 'pinParticipant'; id: string | null }
  | { type: 'setHideNoVideo'; on: boolean }
  | { type: 'setSimulateReduced'; on: boolean }
