import { Hand, MicOff } from 'lucide-react'
import type { Participant } from '../state/types'
import styles from './MiniTile.module.css'

interface MiniTileProps {
  person: Participant
  isSelf: boolean
  speaking: boolean
}

const AWAY_LABEL = { brb: 'BRB', afk: 'AFK' } as const

/** One person in the mini window: palette surface, initial, name, and only the states that matter at this size. */
export function MiniTile({ person, isSelf, speaking }: MiniTileProps) {
  const away = person.status !== 'none' ? AWAY_LABEL[person.status] : null
  const state = [
    isSelf ? 'kamu' : null,
    person.micOn ? null : 'mikrofon mati',
    person.hand !== null ? `tangan terangkat nomor ${person.hand}` : null,
    away,
    speaking ? 'sedang bicara' : null,
  ].filter(Boolean)

  return (
    <li
      className={styles.tile}
      data-palette={person.palette}
      data-speaking={speaking || undefined}
      data-cam={person.camOn || undefined}
      data-away={away ? '' : undefined}
      aria-label={`${person.name}${state.length ? `, ${state.join(', ')}` : ''}`}
    >
      <span className={styles.avatar} aria-hidden="true">
        {person.name.charAt(0).toUpperCase()}
      </span>
      <span className={styles.corner}>
        {away ? (
          <span className={styles.away}>{away}</span>
        ) : (
          !person.micOn && (
            <span className={styles.muted} aria-hidden="true">
              <MicOff size={12} strokeWidth={2.25} />
            </span>
          )
        )}
        {person.hand !== null && (
          <span className={styles.hand} aria-hidden="true">
            <Hand size={12} strokeWidth={2.25} />
            {person.hand}
          </span>
        )}
      </span>
      <span className={styles.name} aria-hidden="true">
        {person.name}
        {isSelf && <em> (Kamu)</em>}
      </span>
    </li>
  )
}
