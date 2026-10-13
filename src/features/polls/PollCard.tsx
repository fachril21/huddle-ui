import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { AnimatedEmoji } from '../../emoji/AnimatedEmoji'
import type { Poll } from '../../state/types'
import { tally } from './pollMath'
import styles from './PollCard.module.css'

interface PollCardProps {
  poll: Poll
  /** Everyone currently in the room (denominator of "x dari y sudah vote") */
  participantCount: number
  selfId: string
  canManage: boolean
  onVote: (optionIds: readonly string[]) => void
  onClose: () => void
  onRestart: () => void
  /** Compact summary used for the history list */
  compact?: boolean
}

const TIMER_R = 15
const TIMER_C = 2 * Math.PI * TIMER_R

/** One poll in every state of Design.md 13.6: not voted, voted, hidden results, closed, tie. */
export function PollCard({ poll, participantCount, selfId, canManage, onVote, onClose, onRestart, compact }: PollCardProps) {
  const t = tally(poll)
  const mine = poll.votes[selfId]
  const closed = poll.status === 'closed'
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<readonly string[]>([])
  const showResults = poll.liveResults || closed || canManage
  const answering = !closed && (!mine || editing)
  const secondsLeft = useSecondsLeft(poll)

  if (compact) return <CompactPoll poll={poll} />

  const toggleDraft = (id: string) => {
    if (!poll.multiple) {
      onVote([id])
      setEditing(false)
      return
    }
    setDraft((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }
  const submitMultiple = () => {
    onVote(draft)
    setEditing(false)
    setDraft([])
  }

  return (
    <section className={styles.card} data-closed={closed} aria-label={`Polling: ${poll.question}`}>
      <header className={styles.head}>
        <h3>{poll.question}</h3>
        {secondsLeft !== null && !closed && <Timer total={poll.autoCloseS ?? 0} left={secondsLeft} />}
      </header>

      <ul className={styles.options}>
        {poll.options.map((o) => {
          const count = t.counts[o.id] ?? 0
          const pct = t.voters ? count / t.voters : 0
          const chosen = answering ? draft.includes(o.id) : (mine?.includes(o.id) ?? false)
          const winner = closed && t.winners.includes(o.id)
          return (
            <li key={o.id}>
              <button
                type="button"
                className={styles.option}
                data-chosen={chosen}
                data-winner={winner}
                disabled={!answering}
                role={poll.multiple ? 'checkbox' : 'radio'}
                aria-checked={chosen}
                onClick={() => toggleDraft(o.id)}
              >
                {showResults && (
                  <motion.span className={styles.fill} initial={false} animate={{ scaleX: pct }} transition={{ type: 'spring', stiffness: 160, damping: 22 }} aria-hidden="true" />
                )}
                <span className={styles.mark} data-multiple={poll.multiple} aria-hidden="true">
                  {chosen && <Check size={12} strokeWidth={3} />}
                </span>
                <span className={styles.text}>{o.text}</span>
                {winner && !t.isTie && <AnimatedEmoji name="trophy" size={26} />}
                {winner && t.isTie && <span className={styles.tie}>Seri</span>}
                {showResults && (
                  <span className={styles.stat}>
                    {Math.round(pct * 100)}% <small>({count})</small>
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {answering && poll.multiple && (
        <button type="button" className={styles.primary} disabled={!draft.length} onClick={submitMultiple}>
          Kirim suara
        </button>
      )}

      {!showResults && mine && <p className={styles.note}>Hasil akan muncul setelah polling ditutup.</p>}

      <footer className={styles.foot}>
        <span className={styles.progress} aria-label={`${t.voters} dari ${participantCount} sudah vote`}>
          <i style={{ transform: `scaleX(${Math.min(1, t.voters / participantCount)})` }} />
        </span>
        <span className={styles.progressText}>
          {t.voters} dari {participantCount} sudah vote
        </span>
        {poll.anonymous && <span className={styles.badge}>Anonim</span>}
      </footer>

      {closed && t.isTie && <p className={styles.note}>Seri: lebih dari satu opsi mendapat suara terbanyak.</p>}

      <div className={styles.actions}>
        {!closed && mine && !editing && (
          <button type="button" className={styles.secondary} onClick={() => { setEditing(true); setDraft(mine) }}>
            Ganti pilihan
          </button>
        )}
        {!closed && canManage && (
          <button type="button" className={styles.danger} onClick={onClose}>
            Tutup polling
          </button>
        )}
        {closed && canManage && (
          <button type="button" className={styles.secondary} onClick={onRestart}>
            Mulai ulang
          </button>
        )}
      </div>
    </section>
  )
}

function CompactPoll({ poll }: { poll: Poll }) {
  const t = tally(poll)
  const winner = poll.options.filter((o) => t.winners.includes(o.id))
  return (
    <section className={styles.compact} aria-label={`Polling selesai: ${poll.question}`}>
      <h4>{poll.question}</h4>
      <p>
        {t.voters} suara · {t.isTie ? `Seri: ${winner.map((w) => w.text).join(', ')}` : winner[0] ? `Menang: ${winner[0].text}` : 'Tanpa suara'}
      </p>
    </section>
  )
}

function Timer({ total, left }: { total: number; left: number }) {
  return (
    <span className={styles.timer} role="timer" aria-label={`${left} detik tersisa`}>
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle className={styles.timerTrack} cx="18" cy="18" r={TIMER_R} />
        <circle className={styles.timerArc} cx="18" cy="18" r={TIMER_R} strokeDasharray={TIMER_C} strokeDashoffset={TIMER_C * (1 - left / total)} />
      </svg>
      <b>{left}</b>
    </span>
  )
}

/** Whole seconds until the poll auto-closes, ticking once a second; null for manual polls. */
function useSecondsLeft(poll: Poll): number | null {
  const [now, setNow] = useState(() => performance.now())
  const live = poll.status === 'active' && poll.autoCloseS !== null
  useEffect(() => {
    if (!live) return
    const id = window.setInterval(() => setNow(performance.now()), 1000)
    return () => window.clearInterval(id)
  }, [live])
  if (!live || poll.autoCloseS === null) return null
  return Math.max(0, Math.ceil((poll.startedAt + poll.autoCloseS * 1000 - now) / 1000))
}
