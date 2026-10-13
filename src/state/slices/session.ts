import { createInitialState } from '../initialState'
import type { ChatMessage, DockToggle, PanelName, RoomState } from '../types'
import { canManage, nextId, NOTICE_MS, roleOf, withNotice } from './shared'
import type { Slice } from './shared'

/** Popovers share one slot above the dock, so opening one closes the others. */
const POPOVERS: readonly DockToggle[] = ['reaction', 'soundboard', 'more', 'leave']

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
      const message: ChatMessage = { id: nextId(state.chat.messages), fromId: action.fromId, toId: action.toId, text, at: Math.round(action.now / 1000) }
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
      return host.waiting.some((g) => g.id === action.guest.id) ? state : { ...state, host: { ...host, waiting: [...host.waiting, action.guest] } }
    case 'guestDecide': {
      const guest = host.waiting.find((g) => g.id === action.id)
      if (!guest) return state
      const next = { ...state, host: { ...host, waiting: host.waiting.filter((g) => g.id !== action.id) } }
      return withNotice(next, action.admit ? `${guest.name} disetujui masuk` : `${guest.name} ditolak`, action.now)
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
      return { ...state, phase: action.phase, toggles: { reaction: false, soundboard: false, more: false, leave: false } }
    case 'reset':
      return createInitialState(state.settings)
    case 'setFx':
      return { ...state, settings: { ...state.settings, fx: action.fx } }
    case 'setSimulateReduced':
      return { ...state, settings: { ...state.settings, simulateReduced: action.on } }
    default:
      return undefined
  }
}
