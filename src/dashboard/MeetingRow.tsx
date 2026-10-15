import { CalendarX, CopyPlus, Ellipsis, Link2, Mail, Pencil, Repeat } from 'lucide-react'
import { entryAction } from './entryAction'
import { Menu } from './Menu'
import type { MenuItem } from './Menu'
import type { MeetingActions } from './meetingActions'
import { PeopleStack } from './PeopleStack'
import { formatClock, occurrenceState } from './schedule'
import { StatusTag } from './StatusTag'
import type { Occurrence } from './types'
import ui from './ui.module.css'
import styles from './MeetingRow.module.css'

interface MeetingRowProps {
  occurrence: Occurrence
  now: Date
  actions: MeetingActions
}

const ICON = { size: 16, strokeWidth: 1.75, 'aria-hidden': true } as const

function menuItems(o: Occurrence, ended: boolean, actions: MeetingActions): MenuItem[] {
  const canManage = o.meeting.isHost && !ended
  return [
    { id: 'invitation', label: 'Salin undangan', icon: <Mail {...ICON} />, onSelect: () => actions.copyInvitation(o) },
    { id: 'link', label: 'Salin tautan', icon: <Link2 {...ICON} />, onSelect: () => actions.copyLink(o) },
    ...(canManage ? [{ id: 'edit', label: 'Ubah jadwal', icon: <Pencil {...ICON} />, onSelect: () => actions.edit(o) }] : []),
    { id: 'duplicate', label: 'Duplikat', icon: <CopyPlus {...ICON} />, onSelect: () => actions.duplicate(o) },
    ...(canManage ? [{ id: 'cancel', label: 'Batalkan rapat', icon: <CalendarX {...ICON} />, tone: 'danger' as const, onSelect: () => actions.cancel(o) }] : []),
  ]
}

/** One session in the agenda: when, what, state, who, the way in, and a menu for the rest. */
export function MeetingRow({ occurrence, now, actions }: MeetingRowProps) {
  const { meeting } = occurrence
  const state = occurrenceState(occurrence, now)
  const entry = entryAction(meeting.isHost, state)

  return (
    <li className={styles.row} data-state={state}>
      <div className={styles.time}>
        <time className={ui.mono} dateTime={occurrence.start.toISOString()}>
          {formatClock(occurrence.start)}
        </time>
        <span>{meeting.durationMin} mnt</span>
      </div>

      <div className={styles.what}>
        <h3>{meeting.title}</h3>
        <p>
          <span>{meeting.isHost ? 'Anda host' : `Host ${meeting.hostName}`}</span>
          <span className={ui.mono}>{meeting.code}</span>
          {meeting.recurrence !== 'none' && (
            <span className={styles.repeat} title="Rapat berulang">
              <Repeat size={12} strokeWidth={1.75} aria-hidden="true" />
              Berulang
            </span>
          )}
        </p>
      </div>

      <StatusTag state={state} />
      <PeopleStack hostName={meeting.hostName} invitees={meeting.invitees} />

      <div className={styles.action}>
        {entry && state !== 'upcoming' && (
          <button type="button" className={`${ui.btn} ${ui.small} ${entry.variant === 'primary' ? ui.primary : ''}`} onClick={() => actions.enter(occurrence)}>
            {entry.label}
          </button>
        )}
        {state === 'upcoming' && meeting.isHost && (
          <button type="button" className={`${ui.btn} ${ui.small}`} onClick={() => actions.edit(occurrence)}>
            Ubah
          </button>
        )}
      </div>

      <Menu
        align="end"
        width={240}
        items={menuItems(occurrence, state === 'ended', actions)}
        trigger={(props) => (
          <button type="button" className={`${ui.btn} ${ui.icon}`} {...props} aria-label={`Aksi untuk ${meeting.title}`}>
            <Ellipsis size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
      />
    </li>
  )
}
