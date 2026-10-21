import { isMeetingCode } from '../dashboard/meetingCode'
import { findByCode } from '../dashboard/meetingStore'
import type { JoinTarget, Meeting } from '../dashboard/types'

/** "/abc-defg-hij" -> the meeting code. Anyone holding such a link goes straight to the lobby, signed in or not. */
export function inviteCodeFromPath(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length !== 1) return null
  const code = parts[0].toLowerCase()
  return isMeetingCode(code) ? code : null
}

/**
 * What the lobby shows for someone who arrived by link. A known meeting keeps its title and host; an unknown
 * code still opens a lobby, because a link must never dead-end. A guest never counts as the host.
 */
export function inviteTarget(code: string, meetings: readonly Meeting[], signedIn: boolean): JoinTarget {
  const meeting = findByCode(meetings, code)
  if (!meeting) return { code, title: 'Rapat Huddle', hostName: 'Host', insideNote: 'Belum ada yang masuk' }
  const isHost = signedIn && meeting.isHost
  return {
    code,
    title: meeting.title,
    hostName: meeting.hostName,
    insideNote: 'Belum ada yang masuk',
    needsApproval: meeting.security.waitingRoom && !isHost,
    hostPresent: isHost,
  }
}
