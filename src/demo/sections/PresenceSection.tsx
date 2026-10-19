import { useState } from 'react'
import type { Dispatch } from 'react'
import type { RoomAction } from '../../state/roomReducer'
import { SELF_ID } from '../../state/types'
import type { RoomState } from '../../state/types'
import { Toggle } from '../controls'
import styles from '../DemoDirector.module.css'

const MENTION = '@Anda boleh tolong cek dokumennya sebentar?'

/** Someone steps away or comes back, and someone calls for you while you are gone. */
export function PresenceSection({ state, dispatch }: { state: RoomState; dispatch: Dispatch<RoomAction> }) {
  const others = state.participants.filter((p) => p.id !== SELF_ID)
  const [who, setWho] = useState('')
  const actor = others.find((p) => p.id === who) ?? others[0]
  const now = () => performance.now()

  if (!actor) return <p className={styles.hint}>Belum ada peserta lain.</p>

  const set = (status: 'brb' | 'afk' | 'none', minutes?: number) => dispatch({ type: 'setPresence', id: actor.id, status, now: now(), minutes })

  return (
    <div className={styles.stack}>
      <label className={styles.pick}>
        <span>Siapa</span>
        <select value={actor.id} onChange={(e) => setWho(e.target.value)}>
          {others.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.status === 'none' ? '' : ` (${p.status.toUpperCase()})`}
            </option>
          ))}
        </select>
      </label>
      <div className={styles.presets}>
        <Toggle label="BRB 5 mnt" on={actor.status === 'brb'} onClick={() => set('brb', 5)} />
        <Toggle label="BRB 1 mnt" onClick={() => set('brb', 1)} />
        <Toggle label="AFK" on={actor.status === 'afk'} onClick={() => set('afk')} />
        <Toggle label="Kembali" onClick={() => set('none')} />
        <Toggle label="Sebut Anda di chat" onClick={() => dispatch({ type: 'chatSend', fromId: actor.id, toId: null, text: MENTION, now: now() })} />
      </div>
    </div>
  )
}
