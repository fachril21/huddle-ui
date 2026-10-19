import { Coffee, Moon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { Participant } from '../state/types'
import shared from '../breakout/breakout.module.css'
import { usePresenceNow } from './PresenceClock'
import { awaySentence } from './presence'
import styles from './presence.module.css'

const SPRING = { type: 'spring', stiffness: 320, damping: 28 } as const

/** While you are away, a bar that says so and offers the way back: the tile alone is not enough if you cannot see it. */
export function AwayBar({ self, onBack }: { self: Participant; onBack: () => void }) {
  const now = usePresenceNow()
  const away = self.status !== 'none'
  const Icon = self.status === 'afk' ? Moon : Coffee
  return (
    <AnimatePresence>
      {away && (
        <motion.div
          key="away"
          className={`glass-2 ${styles.tone} ${styles.bar}`}
          data-status={self.status}
          role="status"
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, transition: { duration: 0.18 } }}
          transition={SPRING}
        >
          <span className={styles.mark} aria-hidden="true">
            <Icon size={16} strokeWidth={1.75} />
          </span>
          <span className={styles.text}>
            Anda <b>{awaySentence(self, now).replace(', ', ' · ')}</b>
          </span>
          <button type="button" className={shared.primary} onClick={onBack}>
            Saya kembali
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
