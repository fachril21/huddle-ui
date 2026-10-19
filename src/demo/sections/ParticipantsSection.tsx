import type { Dispatch } from 'react'
import { DEFAULT_LEVEL } from '../../state/roomReducer'
import type { RoomAction } from '../../state/roomReducer'
import { SELF_ID } from '../../state/types'
import type { Participant, RoomState } from '../../state/types'
import { Toggle } from '../controls'
import styles from '../DemoDirector.module.css'

/** Per-person controls: speaking, natural speech, level, camera, mic, hand, away, and connection states. */
export function ParticipantsSection({ state, dispatch }: { state: RoomState; dispatch: Dispatch<RoomAction> }) {
  return (
    <ul className={styles.list}>
      {state.participants.map((p) => (
        <ParticipantRow key={p.id} participant={p} state={state} dispatch={dispatch} />
      ))}
    </ul>
  )
}

function ParticipantRow({ participant: p, state, dispatch }: { participant: Participant; state: RoomState; dispatch: Dispatch<RoomAction> }) {
  const voice = state.voice[p.id]
  const silenced = !p.micOn && p.id !== SELF_ID

  return (
    <li className={styles.row} data-palette={p.palette} data-silenced={silenced}>
      <div className={styles.who}>
        <i className={styles.dot} aria-hidden="true" />
        <span>{p.name}</span>
        {silenced && <span className={styles.note}>mic mati: tidak menyala</span>}
      </div>
      <div className={styles.toggles}>
        <Toggle
          label="Bicara"
          on={voice.talking}
          onClick={() => dispatch({ type: 'patchVoice', id: p.id, patch: { talking: !voice.talking, level: voice.level < 0.12 ? DEFAULT_LEVEL : voice.level } })}
        />
        <Toggle label="Natural" on={voice.natural} onClick={() => dispatch({ type: 'patchVoice', id: p.id, patch: { natural: !voice.natural } })} />
        <Toggle label="Kamera" on={p.camOn} onClick={() => dispatch({ type: 'toggleCam', id: p.id })} />
        <Toggle label="Mic" on={p.micOn} onClick={() => dispatch({ type: 'toggleMic', id: p.id })} />
      </div>
      <div className={styles.toggles}>
        <Toggle label="Tangan" on={p.hand !== null} onClick={() => dispatch({ type: 'toggleHand', id: p.id })} />
        <Toggle label="AFK" on={p.status === 'afk'} onClick={() => dispatch({ type: 'toggleStatus', id: p.id, status: 'afk', now: performance.now() })} />
        <Toggle label="BRB" on={p.status === 'brb'} onClick={() => dispatch({ type: 'toggleStatus', id: p.id, status: 'brb', now: performance.now() })} />
        <Toggle label="Koneksi buruk" on={p.connection === 'poor'} onClick={() => dispatch({ type: 'toggleConnection', id: p.id, connection: 'poor' })} />
        <Toggle label="Menyambung" on={p.connection === 'reconnecting'} onClick={() => dispatch({ type: 'toggleConnection', id: p.id, connection: 'reconnecting' })} />
      </div>
      <label className={styles.slider}>
        <span className="sr-only">Level suara {p.name}</span>
        <input type="range" min={0} max={1} step={0.01} value={voice.level} onChange={(e) => dispatch({ type: 'patchVoice', id: p.id, patch: { level: Number(e.target.value) } })} />
        <output className={styles.value} aria-live="off">
          {voice.level.toFixed(2)}
        </output>
      </label>
    </li>
  )
}
