import { Ellipsis, Hand, MicOff, Search, UserPlus, VideoOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SELF_ID } from '../../state/types'
import type { Guest, Participant, Role } from '../../state/types'
import { AwayChip } from '../../presence/AwayChip'
import { isAway } from '../../presence/presence'
import { WaitingGuests } from '../host/WaitingGuests'
import styles from './ParticipantsPanel.module.css'

interface ParticipantsPanelProps {
  participants: readonly Participant[]
  /** Guests at the door; only hosts and co-hosts see them here */
  waiting: readonly Guest[]
  selfRole: Role
  onDecide: (guestId: string, admit: boolean) => void
  onAdmitAll: () => void
  onInvite: () => void
  onMute: (id: string) => void
  onCoHost: (id: string) => void
  onMakeHost: (id: string) => void
  onRemove: (id: string) => void
}

/** Search, raised-hand queue, and the participant list with per-person host actions (PRD 8.8). */
export function ParticipantsPanel({ participants, waiting, selfRole, onDecide, onAdmitAll, onInvite, onMute, onCoHost, onMakeHost, onRemove }: ParticipantsPanelProps) {
  const [query, setQuery] = useState('')
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const canManage = selfRole === 'Host' || selfRole === 'Co-host'
  const raised = participants.filter((p) => p.hand !== null).sort((a, b) => (a.hand ?? 0) - (b.hand ?? 0))
  const q = query.trim().toLowerCase()
  const shown = q ? participants.filter((p) => p.name.toLowerCase().includes(q)) : participants

  return (
    <div className={styles.wrap}>
      <label className={styles.search}>
        <Search size={16} strokeWidth={1.75} aria-hidden="true" />
        <input type="search" value={query} placeholder="Cari peserta" aria-label="Cari peserta" onChange={(e) => setQuery(e.target.value)} />
      </label>

      <button type="button" className={styles.invite} onClick={onInvite}>
        <UserPlus size={16} strokeWidth={1.75} aria-hidden="true" />
        Undang lewat tautan
      </button>

      {canManage && <WaitingGuests guests={waiting} onDecide={onDecide} onAdmitAll={onAdmitAll} />}

      {raised.length > 0 && (
        <section aria-label="Antrean tangan terangkat">
          <h3 className={styles.sub}>Tangan terangkat</h3>
          <ol className={styles.queue}>
            {raised.map((p) => (
              <li key={p.id}>
                <span className={styles.seq}>{p.hand}</span>
                {p.name}
                <Hand size={14} strokeWidth={1.75} aria-hidden="true" className={styles.handIcon} />
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-label="Daftar peserta">
        <h3 className={styles.sub}>Di meeting ({participants.length})</h3>
        <ul className={styles.people}>
          {shown.map((p) => (
            <li key={p.id} data-palette={p.palette}>
              <i className={styles.dot} aria-hidden="true">{p.name.charAt(0)}</i>
              <span className={styles.name}>{p.id === SELF_ID ? `${p.name} (Anda)` : p.name}</span>
              {p.role !== 'Peserta' && <span className={styles.role}>{p.role}</span>}
              {isAway(p) && <AwayChip participant={p} />}
              <span className={styles.flags}>
                {!p.micOn && <MicOff size={14} strokeWidth={1.75} aria-label="Mikrofon mati" role="img" />}
                {!p.camOn && <VideoOff size={14} strokeWidth={1.75} aria-label="Kamera mati" role="img" />}
              </span>
              {canManage && p.id !== SELF_ID && (
                <RowMenu
                  person={p}
                  selfRole={selfRole}
                  open={menuFor === p.id}
                  onToggle={() => setMenuFor((cur) => (cur === p.id ? null : p.id))}
                  onClose={() => setMenuFor(null)}
                  onMute={() => onMute(p.id)}
                  onCoHost={() => onCoHost(p.id)}
                  onMakeHost={() => onMakeHost(p.id)}
                  onRemove={() => onRemove(p.id)}
                />
              )}
            </li>
          ))}
          {!shown.length && <li className={styles.none}>Tidak ada peserta bernama "{query}".</li>}
        </ul>
      </section>
    </div>
  )
}

interface RowMenuProps {
  person: Participant
  selfRole: Role
  open: boolean
  onToggle: () => void
  onClose: () => void
  onMute: () => void
  onCoHost: () => void
  onMakeHost: () => void
  onRemove: () => void
}

function RowMenu({ person, selfRole, open, onToggle, onClose, onMute, onCoHost, onMakeHost, onRemove }: RowMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open, onClose])

  const act = (fn: () => void) => () => {
    fn()
    onClose()
  }

  return (
    <div ref={ref} className={styles.menuWrap}>
      <button type="button" className={styles.more} aria-label={`Aksi untuk ${person.name}`} aria-haspopup="menu" aria-expanded={open} onClick={onToggle}>
        <Ellipsis size={18} strokeWidth={1.75} aria-hidden="true" />
      </button>
      {open && (
        <div className={styles.menu} role="menu" aria-label={`Aksi untuk ${person.name}`}>
          <button type="button" role="menuitem" onClick={act(onMute)}>
            {person.micOn ? 'Bisukan' : 'Nyalakan mikrofon'}
          </button>
          {person.role !== 'Co-host' && person.role !== 'Host' && (
            <button type="button" role="menuitem" onClick={act(onCoHost)}>
              Jadikan co-host
            </button>
          )}
          {selfRole === 'Host' && person.role !== 'Host' && (
            <button type="button" role="menuitem" onClick={act(onMakeHost)}>
              Jadikan host
            </button>
          )}
          <button type="button" role="menuitem" data-danger="true" onClick={act(onRemove)}>
            Keluarkan
          </button>
        </div>
      )}
    </div>
  )
}
