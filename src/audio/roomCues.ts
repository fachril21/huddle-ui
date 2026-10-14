import { SELF_ID } from '../state/types'
import type { Participant, RoomState } from '../state/types'
import type { SoundCue } from './fileSounds'

function handCount(participants: readonly Participant[]): number {
  return participants.filter((p) => p.hand !== null).length
}

function ids(participants: readonly Participant[]): Set<string> {
  return new Set(participants.map((p) => p.id))
}

/** Messages from others that reach the user: public, or private to them. */
function incomingChatCount(state: RoomState): number {
  return state.chat.messages.filter((m) => m.fromId !== SELF_ID && (m.toId === null || m.toId === SELF_ID)).length
}

/** Which sound cues a state transition should trigger. Pure, so it is easy to test. */
export function deriveCues(prev: RoomState, next: RoomState): SoundCue[] {
  const cues: SoundCue[] = []
  const prevSelf = prev.participants.find((p) => p.id === SELF_ID)
  const nextSelf = next.participants.find((p) => p.id === SELF_ID)

  if (prevSelf && nextSelf && prevSelf.micOn !== nextSelf.micOn) cues.push(nextSelf.micOn ? 'micUnmute' : 'micMute')

  if (handCount(next.participants) > handCount(prev.participants)) cues.push('raiseHand')

  if (prev.sharerId === null && next.sharerId !== null) cues.push('shareStart')
  if (prev.sharerId !== null && next.sharerId === null) cues.push('shareStop')

  if (incomingChatCount(next) > incomingChatCount(prev)) cues.push('incomingChat')

  if (prev.phase === 'live' && next.phase !== 'live') {
    cues.push('leaveRoom')
  } else if (prev.phase !== 'live' && next.phase === 'live') {
    cues.push('enterRoom')
  } else {
    const before = ids(prev.participants)
    const after = ids(next.participants)
    if ([...after].some((id) => id !== SELF_ID && !before.has(id))) cues.push('enterRoom')
    if ([...before].some((id) => id !== SELF_ID && !after.has(id))) cues.push('leaveRoom')
  }

  if (prevSelf && nextSelf && prevSelf.connection === 'good' && nextSelf.connection !== 'good') cues.push('connectionUnstable')

  return cues
}
