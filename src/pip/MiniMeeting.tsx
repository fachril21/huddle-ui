import type { FxTier, Participant, ReactionName } from '../state/types'
import { SELF_ID } from '../state/types'
import { MiniControls } from './MiniControls'
import { MiniTile } from './MiniTile'
import { pickMiniRoster } from './miniRoster'
import styles from './MiniMeeting.module.css'

interface MiniMeetingProps {
  title: string
  participants: readonly Participant[]
  speaking: ReadonlySet<string>
  /** Name of whoever is sharing, null when nobody is */
  sharerName: string | null
  selfSharing: boolean
  shareDisabledReason?: string
  fx: FxTier
  onToggleMic: () => void
  onToggleCam: () => void
  onToggleHand: () => void
  onReact: (name: ReactionName) => void
  onShare: () => void
  onLeave: () => void
}

/** The meeting at a glance in the always-on-top window: who is here, who is talking, and the controls you reach for. */
export function MiniMeeting({ title, participants, speaking, sharerName, selfSharing, shareDisabledReason, fx, onToggleMic, onToggleCam, onToggleHand, onReact, onShare, onLeave }: MiniMeetingProps) {
  const self = participants.find((p) => p.id === SELF_ID)
  const { shown, hidden } = pickMiniRoster(participants, speaking)
  if (!self) return null

  const status = selfSharing ? 'Kamu sedang berbagi layar' : sharerName ? `${sharerName} berbagi layar` : title

  return (
    <div className={styles.root} data-fx={fx} data-sharing={selfSharing || undefined}>
      <header className={styles.head}>
        <span className={styles.dot} aria-hidden="true" data-live={selfSharing || sharerName !== null || undefined} />
        <h1 className={styles.status}>{status}</h1>
        <span className={styles.count}>{participants.length} orang</span>
      </header>
      <ul className={styles.grid} aria-label="Peserta">
        {shown.map((p) => (
          <MiniTile key={p.id} person={p} isSelf={p.id === SELF_ID} speaking={speaking.has(p.id)} />
        ))}
        {hidden > 0 && (
          <li className={styles.more} aria-label={`${hidden} peserta lainnya`}>
            +{hidden}
          </li>
        )}
      </ul>
      <MiniControls self={self} sharing={selfSharing} shareDisabledReason={shareDisabledReason} onToggleMic={onToggleMic} onToggleCam={onToggleCam} onToggleHand={onToggleHand} onReact={onReact} onShare={onShare} onLeave={onLeave} />
    </div>
  )
}
