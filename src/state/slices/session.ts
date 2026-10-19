import { flipFacing, withDevice } from '../../room/devices/deviceSettings'
import { createInitialState } from '../initialState'
import { isLive, locationOf } from '../../breakout/rooms'
import { awayRecipients } from '../../presence/presence'
import { SELF_ID } from '../types'
import type { ChatMessage, DockToggle, PanelName, RoomState } from '../types'
import { canManage, mapParticipant, nextId, NOTICE_MS, roleOf, withNotice } from './shared'
import type { Slice } from './shared'

/** Popovers share one slot above the dock, so opening one closes the others. */
const POPOVERS: readonly DockToggle[] = ['reaction', 'soundboard', 'more', 'mic', 'camera', 'leave']

function openPopover(state: RoomState, key: DockToggle, open: boolean): RoomState {
  const toggles = Object.fromEntries(POPOVERS.map((k) => [k, false])) as Record<DockToggle, boolean>
  if (open) toggles[key] = true
  return { ...state, toggles }
}

/** Switching to the Chat panel marks everything as read. */
function withPanel(state: RoomState, panel: PanelName | null): RoomState {
  const chat = panel === 'chat' ? { ...state.chat, readCount: state.chat.messages.length } : state.chat
  return { ...state, panel, chat }
}

export const chromeSlice: Slice = (state, action) => {
  switch (action.type) {
    case 'toggleDock':
      return openPopover(state, action.key, !state.toggles[action.key])
    case 'closeDock':
      return state.toggles[action.key] ? openPopover(state, action.key, false) : state
    case 'togglePanel':
      return withPanel(state, state.panel === action.panel ? null : action.panel)
    case 'openPanel':
      return withPanel(state, action.panel)
    default:
      return undefined
  }
}

export const chatSlice: Slice = (state, action) => {
  switch (action.type) {
    case 'chatSend': {
      const text = action.text.trim()
      if (!text) return state
      const roomId = isLive(state.breakout) ? locationOf(state.breakout, action.fromId) : undefined
      const awayIds = awayRecipients(state.participants.filter((p) => p.id !== action.fromId), action.toId, text)
      const message: ChatMessage = { id: nextId(state.chat.messages), fromId: action.fromId, toId: action.toId, text, at: Math.round(action.now / 1000), ...(awayIds.length ? { awayIds } : {}), ...(roomId ? { roomId } : {}) }
      const typingId = state.chat.typingId === action.fromId ? null : state.chat.typingId
      // Messages the user sends, or reads while the Chat panel is open, never count as unread
      const reading = state.panel === 'chat' || action.fromId === 'anda'
      const messages = [...state.chat.messages, message]
      return { ...state, chat: { messages, typingId, readCount: reading ? messages.length : state.chat.readCount } }
    }
    case 'chatTyping':
      return { ...state, chat: { ...state.chat, typingId: action.id } }
    case 'chatRead':
      return { ...state, chat: { ...state.chat, readCount: state.chat.messages.length } }
    default:
      return undefined
  }
}

export const hostSlice: Slice = (state, action) => {
  const host = state.host
  switch (action.type) {
    case 'hostLock':
      return withNotice({ ...state, host: { ...host, locked: action.on } }, action.on ? 'Meeting dikunci' : 'Kunci meeting dibuka', action.now)
    case 'hostRestrictShare':
      return { ...state, host: { ...host, restrictShare: action.on } }
    case 'hostRecording':
      return { ...state, host: { ...host, recording: action.state, consented: action.state === 'off' ? false : host.consented } }
    case 'recordingConsent':
      return { ...state, host: { ...host, consented: true } }
    case 'guestRequest':
      if (host.waiting.some((g) => g.id === action.guest.id)) return state
      // with the waiting room off nobody queues up: the guest just joins
      return host.waitingRoom ? { ...state, host: { ...host, waiting: [...host.waiting, action.guest] } } : withNotice(state, `${action.guest.name} bergabung`, action.guest.at)
    case 'guestAdmitAll': {
      if (host.waiting.length === 0) return state
      const count = host.waiting.length
      return withNotice({ ...state, host: { ...host, waiting: [] } }, count === 1 ? `${host.waiting[0].name} diizinkan masuk` : `${count} tamu diizinkan masuk`, action.now)
    }
    case 'hostWaitingRoom': {
      if (host.waitingRoom === action.on) return state
      // turning it off lets everyone already queued in, since there is no one left to ask
      const next = { ...state, host: { ...host, waitingRoom: action.on, waiting: action.on ? host.waiting : [] } }
      return withNotice(next, action.on ? 'Ruang tunggu dinyalakan' : 'Ruang tunggu dimatikan', action.now)
    }
    case 'guestDecide': {
      const guest = host.waiting.find((g) => g.id === action.id)
      if (!guest) return state
      const next = { ...state, host: { ...host, waiting: host.waiting.filter((g) => g.id !== action.id) } }
      return withNotice(next, action.admit ? `${guest.name} diizinkan masuk` : `${guest.name} ditolak`, action.now)
    }
    case 'announce':
      return { ...state, host: { ...host, announcement: { id: (host.announcement?.id ?? 0) + 1, text: action.text.trim() } } }
    case 'dismissAnnouncement':
      return { ...state, host: { ...host, announcement: null } }
    default:
      return undefined
  }
}

export const sessionSlice: Slice = (state, action) => {
  switch (action.type) {
    case 'startShare': {
      const role = roleOf(state, action.id)
      if (state.sharerId !== null || !role) return state
      if (state.host.restrictShare && !canManage(role)) return state
      return { ...state, sharerId: action.id }
    }
    case 'stopShare':
      return { ...state, sharerId: null }
    case 'notice':
      return withNotice(state, action.text, action.now)
    case 'expireNotices': {
      const alive = state.notices.filter((n) => action.now - n.at < NOTICE_MS)
      return alive.length === state.notices.length ? state : { ...state, notices: alive }
    }
    case 'leave':
      return { ...state, phase: action.phase, toggles: { reaction: false, soundboard: false, more: false, mic: false, camera: false, leave: false } }
    case 'reset':
      return createInitialState(state.settings)
    case 'joinRoom': {
      const joined = mapParticipant(state, SELF_ID, (p) => ({ ...p, name: action.name, micOn: action.micOn, camOn: action.camOn }))
      return { ...joined, settings: { ...joined.settings, cameraQuality: action.quality, devices: action.devices } }
    }
    case 'setFx':
      return { ...state, settings: { ...state.settings, fx: action.fx } }
    case 'setCameraQuality':
      return { ...state, settings: { ...state.settings, cameraQuality: action.quality } }
    case 'setDevice':
      return { ...state, settings: { ...state.settings, devices: withDevice(state.settings.devices, action.kind, action.id) } }
    case 'flipCamera':
      return { ...state, settings: { ...state.settings, devices: flipFacing(state.settings.devices) } }
    case 'setLayoutMode':
      return { ...state, settings: { ...state.settings, layout: { ...state.settings.layout, mode: action.mode } } }
    case 'pinParticipant': {
      // Pinning someone switches to Sorotan; unpinning keeps the mode and lets the speaker take the big tile
      const layout = action.id ? { ...state.settings.layout, mode: 'spotlight' as const, pinnedId: action.id } : { ...state.settings.layout, pinnedId: null }
      return { ...state, settings: { ...state.settings, layout } }
    }
    case 'setHideNoVideo':
      return { ...state, settings: { ...state.settings, layout: { ...state.settings.layout, hideNoVideo: action.on } } }
    case 'setSimulateReduced':
      return { ...state, settings: { ...state.settings, simulateReduced: action.on } }
    default:
      return undefined
  }
}
