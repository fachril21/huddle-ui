import connectionUnstable from './files/connection-unstable.mp3?inline'
import enterRoom from './files/enter-room.mp3?inline'
import incomingChat from './files/incoming-chat.mp3?inline'
import leaveRoom from './files/leave-room.mp3?inline'
import micMute from './files/mic-mute.mp3?inline'
import micUnmute from './files/mic-unmute.mp3?inline'
import raiseHand from './files/raise-hand.mp3?inline'
import shareStart from './files/share-start.mp3?inline'
import shareStop from './files/share-stop.mp3?inline'
import type { SoundCue } from './fileSounds'

/**
 * Sound effects embedded as data URIs and loaded as their own chunk after the first user gesture.
 * Being part of the JS bundle, they never show up as separate audio requests that download managers
 * (IDM and similar) would offer to grab.
 */
export const SOUND_DATA: Readonly<Record<SoundCue, string>> = {
  micMute,
  micUnmute,
  raiseHand,
  shareStart,
  shareStop,
  incomingChat,
  enterRoom,
  leaveRoom,
  connectionUnstable,
}
