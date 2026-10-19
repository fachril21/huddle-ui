import { USER_NAME } from '../dashboard/constants'
import { dayLabel, formatClock } from '../dashboard/schedule'
import type { Recording } from './types'

/** "Hari ini, 10:05" for when the meeting began */
export function whenLabel(r: Recording, now: Date): string {
  const at = new Date(r.startedAt)
  return `${dayLabel(at, now)}, ${formatClock(at)}`
}

/** Only the host (and co-hosts) own a recording; anyone else sees it because the host shared it. */
export function isOwner(r: Recording): boolean {
  return r.hostName === USER_NAME
}

export function ownerLabel(r: Recording): string {
  return isOwner(r) ? 'Anda host' : `Dibagikan ${r.hostName}`
}
