import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { Dispatch } from 'react'
import { DEFAULT_LEVEL } from '../state/roomReducer'
import type { RoomAction, VoicePreset } from '../state/roomReducer'
import { REACTIONS } from '../room/reactions'
import { EMOJI } from '../emoji/registry'
import type { Participant, RoomState } from '../state/types'
import { useState } from 'react'
import styles from './DemoDirector.module.css'

interface DemoDirectorProps {
  state: RoomState
  dispatch: Dispatch<RoomAction>
  open: boolean
  onClose: () => void
}

const PRESETS: readonly { preset: VoicePreset; label: string }[] = [
  { preset: 'silence', label: 'Semua hening' },
  { preset: 'solo', label: 'Satu pembicara' },
  { preset: 'crowd', label: 'Ramai (3 bicara)' },
]

/** Prototype control panel. Deliberately NOT styled like product UI: dashed outline, mono type. */
export function DemoDirector({ state, dispatch, open, onClose }: DemoDirectorProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className={styles.panel}
          aria-label="Demo Director"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8, transition: { duration: 0.15 } }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        >
          <header className={styles.head}>
            <span>DEMO DIRECTOR</span>
            <span className={styles.hint}>Shift+D</span>
            <button type="button" className={styles.close} aria-label="Tutup Demo Director" onClick={onClose}>
              <X size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </header>

          <section className={styles.group} aria-label="Aksi massal">
            <h2>Aksi massal</h2>
            <div className={styles.presets}>
              {PRESETS.map(({ preset, label }) => (
                <button key={preset} type="button" className={styles.btn} onClick={() => dispatch({ type: 'applyVoicePreset', preset })}>
                  {label}
                </button>
              ))}
            </div>
          </section>

          <QuickEvents state={state} dispatch={dispatch} />

          <section className={styles.group} aria-label="Peserta">
            <h2>Peserta</h2>
            <ul className={styles.list}>
              {state.participants.map((p) => (
                <ParticipantRow key={p.id} participant={p} state={state} dispatch={dispatch} />
              ))}
            </ul>
          </section>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function ParticipantRow({ participant: p, state, dispatch }: { participant: Participant; state: RoomState; dispatch: Dispatch<RoomAction> }) {
  const voice = state.voice[p.id]
  const silenced = !p.micOn && p.id !== 'anda'

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
          onClick={() =>
            dispatch({
              type: 'patchVoice',
              id: p.id,
              patch: { talking: !voice.talking, level: voice.level < 0.12 ? DEFAULT_LEVEL : voice.level },
            })
          }
        />
        <Toggle label="Natural" on={voice.natural} onClick={() => dispatch({ type: 'patchVoice', id: p.id, patch: { natural: !voice.natural } })} />
        <Toggle label="Kamera" on={p.camOn} onClick={() => dispatch({ type: 'toggleCam', id: p.id })} />
        <Toggle label="Mic" on={p.micOn} onClick={() => dispatch({ type: 'toggleMic', id: p.id })} />
      </div>
      <div className={styles.toggles}>
        <Toggle label="Tangan" on={p.hand !== null} onClick={() => dispatch({ type: 'toggleHand', id: p.id })} />
        <Toggle label="AFK" on={p.status === 'afk'} onClick={() => dispatch({ type: 'toggleStatus', id: p.id, status: 'afk' })} />
        <Toggle label="BRB" on={p.status === 'brb'} onClick={() => dispatch({ type: 'toggleStatus', id: p.id, status: 'brb' })} />
        <Toggle label="Koneksi buruk" on={p.connection === 'poor'} onClick={() => dispatch({ type: 'toggleConnection', id: p.id, connection: 'poor' })} />
        <Toggle label="Menyambung" on={p.connection === 'reconnecting'} onClick={() => dispatch({ type: 'toggleConnection', id: p.id, connection: 'reconnecting' })} />
      </div>
      <label className={styles.slider}>
        <span className="sr-only">Level suara {p.name}</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={voice.level}
          onChange={(e) => dispatch({ type: 'patchVoice', id: p.id, patch: { level: Number(e.target.value) } })}
        />
        <output className={styles.value} aria-live="off">{voice.level.toFixed(2)}</output>
      </label>
    </li>
  )
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" className={styles.btn} aria-pressed={on} onClick={onClick}>
      {label}
    </button>
  )
}

const REACTION_X_MIN = 24
const REACTION_X_MAX = 200

/** One-click events from other participants. More groups arrive with each milestone. */
function QuickEvents({ state, dispatch }: { state: RoomState; dispatch: Dispatch<RoomAction> }) {
  const others = state.participants.filter((p) => p.id !== 'anda')
  const [who, setWho] = useState(others[0]?.id ?? 'dewi')
  return (
    <section className={styles.group} aria-label='Kejadian cepat'>
      <h2>Kejadian cepat</h2>
      <label className={styles.pick}>
        <span>Dari</span>
        <select value={who} onChange={(e) => setWho(e.target.value)}>
          {others.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className={styles.presets} role='group' aria-label='Reaction dari peserta'>
        {REACTIONS.map((r) => (
          <button
            key={r.name}
            type='button'
            className={styles.btn}
            aria-label={'Reaction ' + r.label}
            onClick={() =>
              dispatch({ type: 'react', senderId: who, name: r.name, x: REACTION_X_MIN + Math.random() * (REACTION_X_MAX - REACTION_X_MIN), now: performance.now() })
            }
          >
            {EMOJI[r.emoji]}
          </button>
        ))}
      </div>
      <div className={styles.presets} role="group" aria-label="High five dari peserta">
        <button type="button" className={styles.btn} onClick={() => dispatch({ type: 'hfOffer', fromId: who, now: performance.now() })}>
          Peserta lain mengajak
        </button>
        <button
          type="button"
          className={styles.btn}
          onClick={() => {
            const target = state.highFive.offers.find((o) => o.fromId !== who)
            if (target) dispatch({ type: 'hfRespond', fromId: target.fromId, byId: who, now: performance.now() })
          }}
        >
          Peserta lain menyambut
        </button>
      </div>
    </section>
  )
}
