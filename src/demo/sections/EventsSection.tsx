import { useRef, useState } from 'react'
import type { Dispatch } from 'react'
import { SOUND_BY_ID, SOUNDS } from '../../audio/soundboardSounds'
import { EMOJI } from '../../emoji/registry'
import { SAMPLE_POLL } from '../../features/polls/pollMath'
import { DOODLE_KINDS, doodleStroke } from '../doodles'
import type { DoodleKind } from '../doodles'
import { REACTIONS } from '../../room/reactions'
import type { RoomAction } from '../../state/roomReducer'
import { SELF_ID } from '../../state/types'
import type { RoomState } from '../../state/types'
import { Toggle } from '../controls'
import styles from '../DemoDirector.module.css'

const REACTION_X_MIN = 24
const REACTION_X_MAX = 200
const TYPING_MS = 1400

/** The ready-made poll from PRD 11.3, as if started by Dewi (3 options, anonymous, live results). */
const SAMPLE_START = {
  question: SAMPLE_POLL.question,
  options: SAMPLE_POLL.options.map((text, i) => ({ id: `o${i + 1}`, text })),
  multiple: false,
  anonymous: true,
  liveResults: true,
  autoCloseS: null,
}

const DOODLE_LABELS: Readonly<Record<DoodleKind, string>> = { circle: 'Melingkari', underline: 'Menggarisbawahi', arrow: 'Menggambar panah' }
const INK_BY_ACTOR = ['rose', 'blue', 'violet', 'amber'] as const

const CHAT_LINES = ['Setuju, kita ambil opsi bertahap.', 'Boleh share dulu hasil minggu lalu?', 'Mantap, lanjut ya.', 'Saya catat di dokumen sprint.']
const GUESTS = ['Budi Santoso', 'Nanda Pratama', 'Citra Lestari', 'Hadi Wijaya']

/** One-click events performed by "someone else" (PRD 9). Pick who, then trigger. */
export function EventsSection({ state, dispatch }: { state: RoomState; dispatch: Dispatch<RoomAction> }) {
  const others = state.participants.filter((p) => p.id !== SELF_ID)
  const [who, setWho] = useState('dewi')
  const [sound, setSound] = useState(SOUNDS[2].id)
  const guestCount = useRef(0)
  const chatCount = useRef(0)
  const actor = others.find((p) => p.id === who)?.id ?? others[0]?.id ?? 'dewi'
  const now = () => performance.now()

  const sendChat = () => {
    dispatch({ type: 'chatTyping', id: actor })
    window.setTimeout(() => {
      const text = CHAT_LINES[chatCount.current++ % CHAT_LINES.length]
      dispatch({ type: 'chatSend', fromId: actor, toId: null, text, now: now() })
    }, TYPING_MS)
  }

  return (
    <div className={styles.stack}>
      <label className={styles.pick}>
        <span>Dari</span>
        <select value={actor} onChange={(e) => setWho(e.target.value)}>
          {others.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.presets} role="group" aria-label="Reaction dari peserta">
        {REACTIONS.map((r) => (
          <button
            key={r.name}
            type="button"
            className={styles.btn}
            aria-label={`Reaction ${r.label}`}
            onClick={() => dispatch({ type: 'react', senderId: actor, name: r.name, x: REACTION_X_MIN + Math.random() * (REACTION_X_MAX - REACTION_X_MIN), now: now() })}
          >
            {EMOJI[r.emoji]}
          </button>
        ))}
      </div>

      <div className={styles.presets} role="group" aria-label="High five dari peserta">
        <Toggle label="Peserta lain mengajak" onClick={() => dispatch({ type: 'hfOffer', fromId: actor, now: now() })} />
        <Toggle
          label="Peserta lain menyambut"
          onClick={() => {
            const target = state.highFive.offers.find((o) => o.fromId !== actor)
            if (target) dispatch({ type: 'hfRespond', fromId: target.fromId, byId: actor, now: now() })
          }}
        />
      </div>

      <div className={styles.presets} role="group" aria-label="Soundboard dari peserta">
        <label className={styles.pick}>
          <span>Suara</span>
          <select value={sound} onChange={(e) => setSound(e.target.value)}>
            {SOUNDS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <Toggle label="Peserta lain memutar suara" onClick={() => dispatch({ type: 'sbPlay', fromId: actor, soundId: sound, durationMs: SOUND_BY_ID[sound]?.durationMs ?? 1500, now: now() })} />
        <Toggle label="Soundboard diizinkan" on={state.soundboard.allowed} onClick={() => dispatch({ type: 'sbAllow', on: !state.soundboard.allowed })} />
      </div>

      <div className={styles.presets} role="group" aria-label="Polling">
        <Toggle label="Dewi memulai polling contoh" onClick={() => dispatch({ type: 'pollStart', poll: { ...SAMPLE_START, creatorId: 'dewi', startedAt: now() } })} />
        <Toggle label="Tutup polling" onClick={() => dispatch({ type: 'pollClose' })} />
      </div>

      <div className={styles.presets} role="group" aria-label="Berbagi layar dari peserta">
        <Toggle label="Peserta berbagi layar" onClick={() => dispatch({ type: 'startShare', id: actor })} />
        <Toggle label="Berhenti berbagi" onClick={() => dispatch({ type: 'stopShare' })} />
      </div>

      <div className={styles.presets} role="group" aria-label="Coret layar dari peserta">
        {DOODLE_KINDS.map((kind) => (
          <Toggle
            key={kind}
            label={`Peserta ${DOODLE_LABELS[kind].toLowerCase()}`}
            onClick={() => dispatch({ type: 'annotationAdd', stroke: doodleStroke(kind, actor, INK_BY_ACTOR[others.findIndex((p) => p.id === actor) % INK_BY_ACTOR.length], now(), 6000) })}
          />
        ))}
        <Toggle label="Coret layar diizinkan" on={state.annotation.allowed} onClick={() => dispatch({ type: 'annotationAllow', on: !state.annotation.allowed })} />
      </div>

      <div className={styles.presets} role="group" aria-label="Klaim host">
        <Toggle label="Host meninggalkan meeting" onClick={() => dispatch({ type: 'vacateHost', now: now() })} />
        <Toggle label="Peserta lain klaim host" onClick={() => dispatch({ type: 'claimHost', id: actor, key: state.host.hostKey, now: now() })} />
        <p className={styles.hint}>Kunci host: {state.host.hostKey}</p>
      </div>

      <div className={styles.presets} role="group" aria-label="Chat, tamu, dan host">
        <Toggle label="Peserta mengirim chat" onClick={sendChat} />
        <Toggle
          label="Tamu meminta masuk"
          onClick={() => {
            const name = GUESTS[guestCount.current % GUESTS.length]
            dispatch({ type: 'guestRequest', guest: { id: `guest-${++guestCount.current}`, name, at: now() } })
          }}
        />
        <Toggle label="Host mengumumkan" onClick={() => dispatch({ type: 'announce', text: 'Sesi dilanjutkan 5 menit lagi, mohon siapkan catatan Anda.' })} />
        <Toggle
          label="Host merekam"
          on={state.host.recording !== 'off'}
          onClick={() => dispatch({ type: 'hostRecording', state: state.host.recording === 'off' ? 'on' : 'off' })}
        />
      </div>
    </div>
  )
}
