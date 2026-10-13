import { ChartColumn } from 'lucide-react'
import { useState } from 'react'
import type { Poll } from '../../state/types'
import { PollCard } from './PollCard'
import { PollForm } from './PollForm'
import type { PollDraft } from './PollForm'
import styles from './PollingPanel.module.css'

interface PollingPanelProps {
  polls: readonly Poll[]
  participantCount: number
  selfId: string
  canManage: boolean
  onStart: (draft: PollDraft) => void
  onVote: (optionIds: readonly string[]) => void
  onClose: () => void
}

/** "Polling" tab: empty state, create form, the live poll, and a history of closed polls (newest first). */
export function PollingPanel({ polls, participantCount, selfId, canManage, onStart, onVote, onClose }: PollingPanelProps) {
  const [creating, setCreating] = useState(false)
  const [prefill, setPrefill] = useState<{ question: string; options: readonly string[] } | undefined>()
  const [latest, ...history] = polls
  const hasActive = latest?.status === 'active'

  const openForm = (initial?: { question: string; options: readonly string[] }) => {
    setPrefill(initial)
    setCreating(true)
  }

  if (creating) {
    return (
      <PollForm
        initial={prefill}
        onCancel={() => setCreating(false)}
        onStart={(draft) => {
          onStart(draft)
          setCreating(false)
        }}
      />
    )
  }

  return (
    <div className={styles.panel}>
      {!latest && (
        <div className={styles.empty}>
          <ChartColumn size={32} strokeWidth={1.5} aria-hidden="true" />
          <h3>Belum ada polling</h3>
          <p>{canManage ? 'Buat polling untuk menanyakan pendapat peserta.' : 'Host akan memulai polling di sini.'}</p>
          {canManage && (
            <button type="button" className={styles.primary} onClick={() => openForm()}>
              Buat polling
            </button>
          )}
        </div>
      )}

      {latest && (
        <PollCard
          key={latest.id}
          poll={latest}
          participantCount={participantCount}
          selfId={selfId}
          canManage={canManage}
          onVote={onVote}
          onClose={onClose}
          onRestart={() => openForm({ question: latest.question, options: latest.options.map((o) => o.text) })}
        />
      )}

      {latest && !hasActive && canManage && (
        <button type="button" className={styles.primary} onClick={() => openForm()}>
          Buat polling baru
        </button>
      )}

      {history.length > 0 && (
        <section aria-label="Riwayat polling" className={styles.history}>
          <h3>Riwayat</h3>
          {history.map((p) => (
            <PollCard key={p.id} compact poll={p} participantCount={participantCount} selfId={selfId} canManage={false} onVote={onVote} onClose={onClose} onRestart={() => undefined} />
          ))}
        </section>
      )}
    </div>
  )
}
