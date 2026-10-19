import { Coffee, Moon } from 'lucide-react'
import { useState } from 'react'
import type { Participant } from '../state/types'
import { usePresenceNow } from './PresenceClock'
import { BRB_CHOICES, awaySentence } from './presence'
import styles from './PresenceControl.module.css'

type Draft = 'brb' | 'afk'

interface PresenceControlProps {
  self: Participant
  /** minutes is the BRB estimate (null: not said); quiet also mutes mic and camera */
  onStart: (status: Draft, minutes: number | null, quiet: boolean) => void
  onBack: () => void
}

const KINDS: readonly { status: Draft; label: string; hint: string; Icon: typeof Coffee }[] = [
  { status: 'brb', label: 'BRB', hint: 'Sebentar', Icon: Coffee },
  { status: 'afk', label: 'AFK', hint: 'Agak lama', Icon: Moon },
]

/** "Status saya" in Lainnya: say you are stepping away, for how long, and whether to go quiet; or say you are back. */
export function PresenceControl({ self, onStart, onBack }: PresenceControlProps) {
  const now = usePresenceNow()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [minutes, setMinutes] = useState<number | null>(5)
  const [quiet, setQuiet] = useState(true)
  const away = self.status !== 'none'

  return (
    <section aria-label="Status saya" className={styles.wrap}>
      <h2>Status saya</h2>
      {away ? (
        <div className={styles.now} data-status={self.status}>
          <span>
            Anda <b>{awaySentence(self, now).replace(', ', ' · ')}</b>
          </span>
          <button type="button" className={styles.start} onClick={onBack}>
            Saya kembali
          </button>
        </div>
      ) : (
        <>
          <div className={styles.kinds} role="group" aria-label="Pergi sebentar">
            {KINDS.map(({ status, label, hint, Icon }) => (
              <button key={status} type="button" data-status={status} aria-pressed={draft === status} onClick={() => setDraft(draft === status ? null : status)}>
                <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                <span>
                  {label}
                  <small>{hint}</small>
                </span>
              </button>
            ))}
          </div>
          {draft ? (
            <div className={styles.config}>
              {draft === 'brb' && (
                <div className={styles.chips} role="group" aria-label="Perkiraan kembali">
                  {BRB_CHOICES.map((m) => (
                    <button key={m} type="button" aria-pressed={minutes === m} onClick={() => setMinutes(m)}>
                      {m} mnt
                    </button>
                  ))}
                  <button type="button" aria-pressed={minutes === null} onClick={() => setMinutes(null)}>
                    Belum tahu
                  </button>
                </div>
              )}
              <button type="button" role="switch" aria-checked={quiet} className={styles.switch} onClick={() => setQuiet(!quiet)}>
                <span>Matikan mic dan kamera juga</span>
                <i aria-hidden="true" />
              </button>
              <button type="button" className={styles.start} onClick={() => onStart(draft, draft === 'brb' ? minutes : null, quiet)}>
                Mulai {draft === 'brb' ? 'BRB' : 'AFK'}
              </button>
            </div>
          ) : (
            <p className={styles.hint}>Beri tahu yang lain kalau Anda meninggalkan layar, supaya sebutan untuk Anda tidak menunggu.</p>
          )}
        </>
      )}
    </section>
  )
}
