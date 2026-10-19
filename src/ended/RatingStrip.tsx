import { Frown, Meh, Smile } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import styles from './EndedPage.module.css'

type Rating = 'bad' | 'ok' | 'good'

const RATINGS: readonly { readonly value: Rating; readonly label: string; readonly icon: LucideIcon }[] = [
  { value: 'bad', label: 'Kurang baik', icon: Frown },
  { value: 'ok', label: 'Biasa', icon: Meh },
  { value: 'good', label: 'Bagus', icon: Smile },
]

const REASONS = ['Suara putus-putus', 'Video patah', 'Ada gema', 'Sulit terhubung'] as const

/** One tap on how the call sounded and looked. Never blocks the way out; nothing is stored in this prototype. */
export function RatingStrip() {
  const [rating, setRating] = useState<Rating | null>(null)
  const [reasons, setReasons] = useState<ReadonlySet<string>>(new Set())
  const [sent, setSent] = useState(false)

  const toggle = (reason: string) =>
    setReasons((prev) => {
      const next = new Set(prev)
      if (!next.delete(reason)) next.add(reason)
      return next
    })

  const pick = (value: Rating) => {
    setRating(value)
    setSent(value !== 'bad')
  }

  if (sent) {
    return (
      <p className={styles.thanks} role="status">
        Terima kasih, masukan Anda membantu kami memperbaiki kualitas rapat.
      </p>
    )
  }

  return (
    <div className={styles.rating}>
      <p id="rating-label" className={styles.ratingTitle}>
        Bagaimana kualitas suara dan video tadi?
      </p>
      <div className={styles.ratingRow} role="group" aria-labelledby="rating-label">
        {RATINGS.map(({ value, label, icon: Icon }) => (
          <button key={value} type="button" className={styles.rate} aria-pressed={rating === value} onClick={() => pick(value)}>
            <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      {rating === 'bad' && (
        <div className={styles.reasons}>
          <p className={styles.ratingTitle}>Apa yang terganggu?</p>
          <div className={styles.chipRow} role="group" aria-label="Yang terganggu">
            {REASONS.map((reason) => (
              <button key={reason} type="button" className={styles.chip} aria-pressed={reasons.has(reason)} onClick={() => toggle(reason)}>
                {reason}
              </button>
            ))}
          </div>
          <button type="button" className={styles.send} onClick={() => setSent(true)}>
            Kirim masukan
          </button>
        </div>
      )}
    </div>
  )
}
