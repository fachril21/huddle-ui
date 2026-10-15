import type { ReactNode } from 'react'
import { MeetingRow } from './MeetingRow'
import type { MeetingActions } from './meetingActions'
import { formatLongDay } from './schedule'
import type { DayGroup } from './schedule'
import styles from './AgendaGroups.module.css'

interface AgendaGroupsProps {
  groups: readonly DayGroup[]
  now: Date
  actions: MeetingActions
  /** Hide the day heading when the section title already says it ("Hari ini") */
  showDayLabels: boolean
  empty: ReactNode
}

/** Sessions grouped under their day, rows divided by hairlines rather than boxed into cards. */
export function AgendaGroups({ groups, now, actions, showDayLabels, empty }: AgendaGroupsProps) {
  if (groups.length === 0) return <div className={styles.empty}>{empty}</div>
  return (
    <div className={styles.groups}>
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label}>
          {showDayLabels && (
            <h3 className={styles.day}>
              {group.label}
              {group.label !== formatLongDay(group.occurrences[0].start) && <span>{formatLongDay(group.occurrences[0].start)}</span>}
            </h3>
          )}
          <ul className={styles.list}>
            {group.occurrences.map((o) => (
              <MeetingRow key={o.key} occurrence={o} now={now} actions={actions} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
