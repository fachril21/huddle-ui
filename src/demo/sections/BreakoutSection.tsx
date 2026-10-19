import { useState } from 'react'
import type { Dispatch } from 'react'
import { isLive, locationOf, roomName } from '../../breakout/rooms'
import type { RoomAction } from '../../state/roomReducer'
import { MAIN_ROOM, SELF_ID } from '../../state/types'
import type { RoomState } from '../../state/types'
import { Toggle } from '../controls'
import styles from '../DemoDirector.module.css'

/** Ruang diskusi from the participants' side: who asks for help, who walks in and out, and the clock running out. */
export function BreakoutSection({ state, dispatch }: { state: RoomState; dispatch: Dispatch<RoomAction> }) {
  const b = state.breakout
  const others = state.participants.filter((p) => p.id !== SELF_ID)
  const [who, setWho] = useState('')
  const actor = others.find((p) => p.id === who)?.id ?? others[0]?.id
  const now = () => performance.now()
  const live = isLive(b)

  if (!live) return <p className={styles.hint}>Buka ruang diskusi dari panel Ruang diskusi dulu.</p>

  const there = actor ? locationOf(b, actor) : MAIN_ROOM
  const target = b.rooms.find((r) => r.id !== there)?.id ?? b.rooms[0]?.id

  return (
    <div className={styles.stack}>
      <label className={styles.pick}>
        <span>Dari</span>
        <select value={actor ?? ''} onChange={(e) => setWho(e.target.value)}>
          {others.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({there === MAIN_ROOM || p.id !== actor ? (locationOf(b, p.id) === MAIN_ROOM ? 'utama' : roomName(b, locationOf(b, p.id))) : roomName(b, there)})
            </option>
          ))}
        </select>
      </label>
      <div className={styles.presets}>
        {actor && there !== MAIN_ROOM && <Toggle label="Minta bantuan" onClick={() => dispatch({ type: 'breakoutHelp', id: actor, now: now() })} />}
        {actor && target && <Toggle label={`Masuk ${roomName(b, target)}`} onClick={() => dispatch({ type: 'breakoutJoin', id: actor, roomId: target, now: now() })} />}
        {actor && there !== MAIN_ROOM && <Toggle label="Keluar ke utama" onClick={() => dispatch({ type: 'breakoutLeave', id: actor, now: now() })} />}
        {b.phase === 'open' && b.closesAt !== null && <Toggle label="Habiskan timer" onClick={() => dispatch({ type: 'breakoutTick', now: b.closesAt ?? now() })} />}
        {b.phase === 'closing' && b.closingEndsAt !== null && <Toggle label="Selesaikan hitungan" onClick={() => dispatch({ type: 'breakoutTick', now: b.closingEndsAt ?? now() })} />}
      </div>
    </div>
  )
}
