import { nameFromEmail } from './people'
import type { Occurrence } from './types'

export type RoleFilter = 'all' | 'host' | 'invited'

/** Search across title, code, host and invitee names; role narrows to meetings Anda host or were invited to. */
export function filterOccurrences(list: readonly Occurrence[], query: string, role: RoleFilter): Occurrence[] {
  const needle = query.trim().toLowerCase()
  return list.filter((o) => {
    const m = o.meeting
    if (role === 'host' && !m.isHost) return false
    if (role === 'invited' && m.isHost) return false
    if (!needle) return true
    return [m.title, m.code, m.hostName, ...m.invitees.map(nameFromEmail)].some((field) => field.toLowerCase().includes(needle))
  })
}
