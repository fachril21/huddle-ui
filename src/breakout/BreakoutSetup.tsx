import { Minus, Plus, Shuffle } from 'lucide-react'
import { useState } from 'react'
import type { Dispatch } from 'react'
import { Sheet } from '../mobile/Sheet'
import { DEFAULT_BREAKOUT_OPTIONS } from '../state/initialState'
import type { RoomAction } from '../state/actions'
import type { BreakoutMode, BreakoutOptions, RoomState } from '../state/types'
import shared from './breakout.module.css'
import { MAX_ROOMS, MIN_ROOMS, isManager, locationOf, roomName } from './rooms'
import styles from './BreakoutSetup.module.css'

interface BreakoutSetupProps {
  state: RoomState
  now: number
  dispatch: Dispatch<RoomAction>
  onClose: () => void
}

const MODES: readonly { mode: BreakoutMode; label: string; hint: string }[] = [
  { mode: 'auto', label: 'Otomatis', hint: 'Peserta dibagi merata ke tiap ruang. Anda masih bisa memindahkan satu per satu.' },
  { mode: 'manual', label: 'Manual', hint: 'Anda menempatkan setiap orang sendiri.' },
  { mode: 'choice', label: 'Pilih sendiri', hint: 'Peserta masuk ke ruang yang mereka mau.' },
]

const AUTO_CLOSE: readonly { value: number | null; label: string }[] = [
  { value: null, label: 'Tidak otomatis' },
  { value: 5, label: '5 menit' },
  { value: 10, label: '10 menit' },
  { value: 15, label: '15 menit' },
  { value: 30, label: '30 menit' },
]

const UNPLACED = ''

/** Make the rooms (how many, how people get in) and, once they exist, place each person. One sheet, two steps. */
export function BreakoutSetup({ state, now, dispatch, onClose }: BreakoutSetupProps) {
  const b = state.breakout
  return b.phase === 'off' ? <CreateStep state={state} dispatch={dispatch} onClose={onClose} /> : <PlaceStep state={state} now={now} dispatch={dispatch} onClose={onClose} />
}

function CreateStep({ state, dispatch, onClose }: Omit<BreakoutSetupProps, 'now'>) {
  const people = state.participants.filter((p) => !isManager(p)).length
  const max = Math.max(MIN_ROOMS, Math.min(MAX_ROOMS, people))
  const [count, setCount] = useState(Math.min(2, max))
  const [mode, setMode] = useState<BreakoutMode>('auto')
  const [options, setOptions] = useState<BreakoutOptions>(DEFAULT_BREAKOUT_OPTIONS)

  const create = () => {
    dispatch({ type: 'breakoutCreate', count, mode, options })
  }

  return (
    <Sheet
      title="Buat ruang diskusi"
      size="tall"
      onClose={onClose}
      footer={
        <div className={styles.footer}>
          <button type="button" className={shared.quiet} onClick={onClose}>
            Batal
          </button>
          <button type="button" className={shared.primary} onClick={create}>
            Buat {count} ruang
          </button>
        </div>
      }
    >
      <div className={styles.form}>
        <section aria-labelledby="bo-count">
          <h3 id="bo-count">Jumlah ruang</h3>
          <div className={styles.stepper}>
            <button type="button" className={shared.outline} aria-label="Kurangi ruang" disabled={count <= MIN_ROOMS} onClick={() => setCount((c) => c - 1)}>
              <Minus size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <output aria-live="polite">{count}</output>
            <button type="button" className={shared.outline} aria-label="Tambah ruang" disabled={count >= max} onClick={() => setCount((c) => c + 1)}>
              <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <span className={styles.hint}>{people} peserta di luar host dan co-host</span>
          </div>
        </section>

        <section aria-labelledby="bo-mode">
          <h3 id="bo-mode">Cara menempatkan</h3>
          <div className={styles.segment} role="radiogroup" aria-labelledby="bo-mode">
            {MODES.map((m) => (
              <button key={m.mode} type="button" role="radio" aria-checked={mode === m.mode} onClick={() => setMode(m.mode)}>
                {m.label}
              </button>
            ))}
          </div>
          <p className={styles.hint}>{MODES.find((m) => m.mode === mode)?.hint}</p>
        </section>

        <OptionsSection options={options} onChange={(patch) => setOptions((o) => ({ ...o, ...patch }))} />
      </div>
    </Sheet>
  )
}

function PlaceStep({ state, now, dispatch, onClose }: BreakoutSetupProps) {
  const b = state.breakout
  const people = state.participants.filter((p) => !isManager(p))
  const prepared = b.phase === 'prepared'
  const closing = b.phase === 'closing'

  const shuffle = () => {
    const order = [...people.map((p) => p.id)]
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    dispatch({ type: 'breakoutShuffle', order })
  }

  const counts = b.rooms.map((r) => ({ room: r, n: people.filter((p) => b.assignment[p.id] === r.id).length }))
  const unplaced = people.filter((p) => !b.assignment[p.id]).length

  return (
    <Sheet
      title="Atur penempatan"
      size="tall"
      onClose={onClose}
      footer={
        <div className={styles.footer}>
          {prepared && b.mode === 'auto' && (
            <button type="button" className={shared.outline} onClick={shuffle}>
              <Shuffle size={16} strokeWidth={1.75} aria-hidden="true" />
              Acak ulang
            </button>
          )}
          {prepared ? (
            <button
              type="button"
              className={shared.primary}
              onClick={() => {
                dispatch({ type: 'breakoutOpen', now })
                onClose()
              }}
            >
              Buka semua ruang
            </button>
          ) : (
            <button type="button" className={shared.primary} onClick={onClose}>
              Selesai
            </button>
          )}
        </div>
      }
    >
      <div className={styles.form}>
        <ul className={styles.tally} aria-label="Isi tiap ruang">
          {counts.map(({ room, n }) => (
            <li key={room.id}>
              <b>{room.name}</b> {n}
            </li>
          ))}
          <li>
            <b>Belum ditempatkan</b> {unplaced}
          </li>
        </ul>

        <section aria-labelledby="bo-people">
          <h3 id="bo-people">Peserta</h3>
          <ul className={styles.people}>
            {people.map((p) => {
              const placed = b.assignment[p.id] ?? UNPLACED
              const where = locationOf(b, p.id)
              return (
                <li key={p.id}>
                  <span className={styles.who}>
                    <span className={styles.name}>{p.name}</span>
                    {b.phase === 'open' && <span className={styles.where}>{where === 'main' ? 'di ruang utama' : `di ${roomName(b, where)}`}</span>}
                  </span>
                  <select aria-label={`Ruang untuk ${p.name}`} value={placed} disabled={closing} onChange={(e) => dispatch({ type: 'breakoutAssign', id: p.id, roomId: e.target.value === UNPLACED ? null : e.target.value, now })}>
                    <option value={UNPLACED}>Belum ditempatkan</option>
                    {b.rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </li>
              )
            })}
          </ul>
        </section>

        {!closing && <OptionsSection options={b.options} onChange={(options) => dispatch({ type: 'breakoutOptions', options })} />}
      </div>
    </Sheet>
  )
}

function OptionsSection({ options, onChange }: { options: BreakoutOptions; onChange: (patch: Partial<BreakoutOptions>) => void }) {
  return (
    <section aria-labelledby="bo-options">
      <h3 id="bo-options">Pilihan</h3>
      <Switch label="Pindahkan peserta otomatis, tanpa menunggu mereka menekan Masuk" on={options.autoMove} onChange={(autoMove) => onChange({ autoMove })} />
      <Switch label="Boleh kembali ke ruang utama kapan saja" on={options.allowReturn} onChange={(allowReturn) => onChange({ allowReturn })} />
      <Switch label="Tampilkan sisa waktu ke peserta" on={options.showTimer} onChange={(showTimer) => onChange({ showTimer })} />
      <label className={styles.select}>
        <span>Tutup ruang</span>
        <select value={options.autoCloseMin ?? ''} onChange={(e) => onChange({ autoCloseMin: e.target.value === '' ? null : Number(e.target.value) })}>
          {AUTO_CLOSE.map((o) => (
            <option key={o.label} value={o.value ?? ''}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  )
}

function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} className={styles.switch} onClick={() => onChange(!on)}>
      <span>{label}</span>
      <i aria-hidden="true" />
    </button>
  )
}
