import { Check, DoorOpen, HandHelping, LogOut, Timer } from 'lucide-react'
import type { Dispatch } from 'react'
import type { RoomAction } from '../state/actions'
import { MAIN_ROOM, SELF_ID } from '../state/types'
import type { RoomState } from '../state/types'
import shared from './breakout.module.css'
import { TIMER_WARNING_MS, clockLabel, isLive, isManager, locationOf, roomName, timeLeftMs, toneOfRoom } from './rooms'
import styles from './RoomStrip.module.css'

interface RoomStripProps {
  /** The whole meeting, not the user's room: the strip needs the placements and the timer */
  state: RoomState
  now: number
  dispatch: Dispatch<RoomAction>
}

/** The one line that tells you which room you are in, how long it lasts, and the two things you may want from it. */
export function RoomStrip({ state, now, dispatch }: RoomStripProps) {
  const b = state.breakout
  const room = locationOf(b, SELF_ID)
  const self = state.participants.find((p) => p.id === SELF_ID)
  if (!isLive(b) || room === MAIN_ROOM || !self) return null

  const closing = b.phase === 'closing'
  const left = timeLeftMs(b, now)
  const warning = !closing && left !== null && left <= TIMER_WARNING_MS
  const manager = isManager(self)
  const asked = b.help.some((h) => h.byId === SELF_ID)
  const canReturn = closing || manager || b.options.allowReturn
  const leave = () => dispatch({ type: 'breakoutLeave', id: SELF_ID, now })

  return (
    <div className={`glass-2 ${shared.tone} ${styles.strip}`} data-tone={toneOfRoom(b, room)} data-state={closing ? 'closing' : warning ? 'warning' : 'open'} role="group" aria-label={`Anda di ${roomName(b, room)}`}>
      <span className={shared.mark} aria-hidden="true">
        <DoorOpen size={16} strokeWidth={1.75} />
      </span>
      <span className={styles.name}>{roomName(b, room)}</span>
      {left !== null && (closing || b.options.showTimer) && (
        <span className={styles.time} role="timer" aria-label={closing ? 'Ruang ditutup dalam' : 'Sisa waktu'}>
          <Timer size={14} strokeWidth={1.75} aria-hidden="true" />
          {closing ? 'Ditutup dalam ' : warning ? 'Sisa ' : ''}
          {clockLabel(left)}
        </span>
      )}
      <span className={styles.actions}>
        {!manager && !closing && (
          <button type="button" className={shared.outline} disabled={asked} onClick={() => dispatch({ type: 'breakoutHelp', id: SELF_ID, now })}>
            {asked ? <Check size={16} strokeWidth={1.75} aria-hidden="true" /> : <HandHelping size={16} strokeWidth={1.75} aria-hidden="true" />}
            {asked ? 'Bantuan diminta' : 'Minta bantuan'}
          </button>
        )}
        {canReturn && (
          <button type="button" className={closing ? shared.primary : shared.quiet} onClick={leave}>
            <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
            {closing ? 'Kembali sekarang' : 'Ruang utama'}
          </button>
        )}
      </span>
    </div>
  )
}
