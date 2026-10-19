import { DoorOpen, HandHelping, Megaphone, Plus, Settings2, Timer, UserRoundX } from 'lucide-react'
import { useState } from 'react'
import type { Dispatch } from 'react'
import type { RoomAction } from '../state/actions'
import { MAIN_ROOM, SELF_ID } from '../state/types'
import type { BreakoutRoom, RoomState } from '../state/types'
import shared from './breakout.module.css'
import { MAX_ROOMS, clockLabel, invitationFor, isManager, locationOf, membersOf, roomTone, timeLeftMs, unplacedIds } from './rooms'
import styles from './BreakoutPanel.module.css'

interface BreakoutPanelProps {
  /** The whole meeting: the panel shows every room, not only yours */
  state: RoomState
  now: number
  dispatch: Dispatch<RoomAction>
  onSetup: () => void
}

const MAX_BROADCAST = 140

/** The "Ruang diskusi" panel: the host's control room, and for everyone else the way into their room. */
export function BreakoutPanel({ state, now, dispatch, onSetup }: BreakoutPanelProps) {
  const self = state.participants.find((p) => p.id === SELF_ID)
  if (!self) return null
  return isManager(self) ? <ManagerView state={state} now={now} dispatch={dispatch} onSetup={onSetup} /> : <MemberView state={state} now={now} dispatch={dispatch} />
}

function ManagerView({ state, now, dispatch, onSetup }: BreakoutPanelProps) {
  const b = state.breakout

  if (b.phase === 'off') {
    return (
      <div className={styles.empty}>
        <span className={`${shared.mark} ${styles.bigMark}`} aria-hidden="true">
          <DoorOpen size={22} strokeWidth={1.75} />
        </span>
        <h3>Bagi peserta ke ruang diskusi</h3>
        <p>Pecah rapat jadi kelompok kecil, lalu panggil semua kembali kapan saja. Anda tetap di ruang utama sampai Anda masuk ke salah satunya.</p>
        <button type="button" className={shared.primary} onClick={onSetup}>
          <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
          Buat ruang diskusi
        </button>
      </div>
    )
  }

  const unplaced = unplacedIds(state).length
  const left = timeLeftMs(b, now)
  const live = b.phase === 'open' || b.phase === 'closing'

  return (
    <div className={styles.wrap}>
      <p className={styles.status} role="status">
        {b.phase === 'prepared' && 'Ruang siap, belum dibuka. Peserta belum bisa masuk.'}
        {b.phase === 'open' && (
          <>
            Ruang dibuka
            {left !== null && (
              <span className={styles.timer}>
                <Timer size={14} strokeWidth={1.75} aria-hidden="true" />
                sisa {clockLabel(left)}
              </span>
            )}
          </>
        )}
        {b.phase === 'closing' && (
          <>
            Ruang ditutup dalam <span className={styles.timer}>{clockLabel(left ?? 0)}</span>
          </>
        )}
      </p>

      {b.help.length > 0 && (
        <ul className={styles.help} aria-label="Permintaan bantuan">
          {b.help.map((h) => {
            const room = b.rooms.find((r) => r.id === h.roomId)
            return (
              <li key={h.byId}>
                <HandHelping size={16} strokeWidth={1.75} aria-hidden="true" />
                <span>
                  <b>{room?.name ?? 'Ruang'}</b> meminta bantuan
                </span>
                <button type="button" className={shared.quiet} onClick={() => dispatch({ type: 'breakoutHelpDone', roomId: h.roomId })}>
                  Selesai
                </button>
                <button
                  type="button"
                  className={shared.primary}
                  onClick={() => {
                    dispatch({ type: 'breakoutJoin', id: SELF_ID, roomId: h.roomId, now })
                    dispatch({ type: 'breakoutHelpDone', roomId: h.roomId })
                  }}
                >
                  Gabung
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <ul className={styles.rooms} aria-label="Ruang diskusi">
        {b.rooms.map((room, i) => (
          <RoomCard key={room.id} room={room} index={i} state={state} now={now} dispatch={dispatch} />
        ))}
      </ul>

      {unplaced > 0 && (
        <p className={styles.note}>
          <UserRoundX size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>{unplaced === 1 ? '1 orang belum ditempatkan' : `${unplaced} orang belum ditempatkan`} dan tetap di ruang utama.</span>
          <button type="button" className={shared.quiet} onClick={onSetup}>
            Tempatkan
          </button>
        </p>
      )}

      {live && <BroadcastForm onSend={(text) => dispatch({ type: 'breakoutBroadcast', fromId: SELF_ID, text, now })} />}

      <div className={styles.actions}>
        {b.phase === 'prepared' && (
          <button type="button" className={shared.primary} onClick={() => dispatch({ type: 'breakoutOpen', now })}>
            Buka semua ruang
          </button>
        )}
        {b.phase === 'open' && (
          <button type="button" className={shared.danger} onClick={() => dispatch({ type: 'breakoutClose', now })}>
            Tutup semua ruang
          </button>
        )}
        {b.phase === 'closing' && (
          <button type="button" className={shared.danger} onClick={() => dispatch({ type: 'breakoutClose', now, immediate: true })}>
            Tutup sekarang
          </button>
        )}
        {b.phase !== 'closing' && (
          <button type="button" className={shared.outline} onClick={onSetup}>
            <Settings2 size={16} strokeWidth={1.75} aria-hidden="true" />
            Atur penempatan
          </button>
        )}
        {b.phase !== 'closing' && b.rooms.length < MAX_ROOMS && (
          <button type="button" className={shared.outline} onClick={() => dispatch({ type: 'breakoutAddRoom' })}>
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
            Tambah ruang
          </button>
        )}
        {b.phase === 'prepared' && (
          <button type="button" className={shared.quiet} onClick={() => dispatch({ type: 'breakoutDiscard' })}>
            Buang rencana
          </button>
        )}
      </div>
    </div>
  )
}

function RoomCard({ room, index, state, now, dispatch }: { room: BreakoutRoom; index: number; state: RoomState; now: number; dispatch: Dispatch<RoomAction> } ) {
  const b = state.breakout
  const inside = membersOf(state, room.id)
  const placed = state.participants.filter((p) => b.assignment[p.id] === room.id)
  const people = b.phase === 'prepared' ? placed : inside
  const mine = locationOf(b, SELF_ID) === room.id
  const live = b.phase === 'open'

  return (
    <li className={`${shared.tone} ${styles.room}`} data-tone={roomTone(index)}>
      <span className={shared.mark} aria-hidden="true">
        <DoorOpen size={16} strokeWidth={1.75} />
      </span>
      <div className={styles.roomBody}>
        <h4>
          {room.name} <span className={styles.count}>{people.length} orang</span>
        </h4>
        <p className={styles.people}>{people.length > 0 ? people.map((p) => p.name).join(', ') : b.phase === 'prepared' ? 'Belum ada yang ditempatkan' : 'Kosong'}</p>
      </div>
      {live && (
        <button type="button" className={mine ? shared.quiet : shared.outline} disabled={mine} onClick={() => dispatch({ type: 'breakoutJoin', id: SELF_ID, roomId: room.id, now })}>
          {mine ? 'Anda di sini' : 'Gabung'}
        </button>
      )}
      {b.phase === 'prepared' && placed.length === 0 && b.rooms.length > 2 && (
        <button type="button" className={shared.quiet} aria-label={`Hapus ${room.name}`} onClick={() => dispatch({ type: 'breakoutRemoveRoom', roomId: room.id })}>
          Hapus
        </button>
      )}
    </li>
  )
}

function BroadcastForm({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('')
  return (
    <form
      className={styles.broadcast}
      onSubmit={(e) => {
        e.preventDefault()
        if (!text.trim()) return
        onSend(text)
        setText('')
      }}
    >
      <input value={text} maxLength={MAX_BROADCAST} placeholder="Pesan untuk semua ruang" aria-label="Pesan untuk semua ruang" onChange={(e) => setText(e.target.value)} />
      <button type="submit" className={shared.primary} disabled={!text.trim()}>
        <Megaphone size={16} strokeWidth={1.75} aria-hidden="true" />
        Kirim
      </button>
    </form>
  )
}

function MemberView({ state, now, dispatch }: Omit<BreakoutPanelProps, 'onSetup'>) {
  const b = state.breakout
  const here = locationOf(b, SELF_ID)
  const invited = invitationFor(b, SELF_ID)
  const live = b.phase === 'open' || b.phase === 'closing'

  if (!live) {
    return (
      <div className={styles.empty}>
        <span className={`${shared.mark} ${styles.bigMark}`} aria-hidden="true">
          <DoorOpen size={22} strokeWidth={1.75} />
        </span>
        <h3>Belum ada ruang diskusi</h3>
        <p>Saat host membuka ruang diskusi, Anda akan diberi tahu di sini dan bisa langsung masuk.</p>
      </div>
    )
  }

  const left = timeLeftMs(b, now)
  const closing = b.phase === 'closing'
  const canChoose = b.mode === 'choice' && !closing
  const room = b.rooms.find((r) => r.id === here)

  return (
    <div className={styles.wrap}>
      <p className={styles.status} role="status">
        {here === MAIN_ROOM ? 'Anda di ruang utama.' : `Anda di ${room?.name}.`}
        {left !== null && (closing || b.options.showTimer) && (
          <span className={styles.timer}>
            <Timer size={14} strokeWidth={1.75} aria-hidden="true" />
            {closing ? 'ditutup dalam' : 'sisa'} {clockLabel(left)}
          </span>
        )}
      </p>

      {here === MAIN_ROOM && invited && !canChoose && (
        <p className={styles.note}>
          <DoorOpen size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>Anda ditempatkan di {b.rooms.find((r) => r.id === invited)?.name}.</span>
          <button type="button" className={shared.primary} onClick={() => dispatch({ type: 'breakoutJoin', id: SELF_ID, roomId: invited, now })}>
            Masuk
          </button>
        </p>
      )}
      {here === MAIN_ROOM && !invited && !canChoose && <p className={styles.note}>Anda belum ditempatkan di ruang mana pun. Tunggu host menempatkan Anda.</p>}

      {(canChoose || here !== MAIN_ROOM) && (
        <ul className={styles.rooms} aria-label="Ruang diskusi">
          {b.rooms.map((r, i) => {
            const mine = r.id === here
            const count = membersOf(state, r.id).length
            return (
              <li key={r.id} className={`${shared.tone} ${styles.room}`} data-tone={roomTone(i)}>
                <span className={shared.mark} aria-hidden="true">
                  <DoorOpen size={16} strokeWidth={1.75} />
                </span>
                <div className={styles.roomBody}>
                  <h4>
                    {r.name} <span className={styles.count}>{count} orang</span>
                  </h4>
                </div>
                {canChoose && (
                  <button type="button" className={mine ? shared.quiet : shared.outline} disabled={mine || (!b.options.allowReturn && here !== MAIN_ROOM)} onClick={() => dispatch({ type: 'breakoutJoin', id: SELF_ID, roomId: r.id, now })}>
                    {mine ? 'Anda di sini' : 'Masuk'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {here !== MAIN_ROOM && (
        <div className={styles.actions}>
          {!closing && (
            <button type="button" className={shared.outline} disabled={b.help.some((h) => h.byId === SELF_ID)} onClick={() => dispatch({ type: 'breakoutHelp', id: SELF_ID, now })}>
              <HandHelping size={16} strokeWidth={1.75} aria-hidden="true" />
              {b.help.some((h) => h.byId === SELF_ID) ? 'Bantuan diminta' : 'Minta bantuan'}
            </button>
          )}
          {(closing || b.options.allowReturn) && (
            <button type="button" className={shared.quiet} onClick={() => dispatch({ type: 'breakoutLeave', id: SELF_ID, now })}>
              Kembali ke ruang utama
            </button>
          )}
        </div>
      )}
    </div>
  )
}
