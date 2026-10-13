import { AnimatePresence, motion } from 'motion/react'
import { AnimatedEmoji } from '../emoji/AnimatedEmoji'
import type { HighFiveClaim, HighFiveOffer, Participant } from '../state/types'
import { SELF_ID } from '../state/types'
import styles from './HighFiveToasts.module.css'

interface HighFiveToastsProps {
  offers: readonly HighFiveOffer[]
  claims: readonly HighFiveClaim[]
  participants: readonly Participant[]
  onRespond: (fromId: string) => void
}

const MAX_TOASTS = 3

/**
 * Top-center glass-2 toast for each open offer from someone else. When another person gets there first
 * the toast turns into a quiet "Sudah disambut ..." (Design.md 11.5). No sound, no failure tone.
 */
export function HighFiveToasts({ offers, claims, participants, onRespond }: HighFiveToastsProps) {
  const nameOf = (id: string) => participants.find((p) => p.id === id)?.name ?? ''
  const open = offers.filter((o) => o.fromId !== SELF_ID).map((o) => ({ key: `o${o.id}`, fromId: o.fromId, kind: 'open' as const, by: '' }))
  const taken = claims
    .filter((c) => c.byId !== SELF_ID && c.fromId !== SELF_ID)
    .map((c) => ({ key: `c${c.offerId}`, fromId: c.fromId, kind: 'taken' as const, by: nameOf(c.byId) }))
  const items = [...open, ...taken].slice(0, MAX_TOASTS)

  return (
    <div className={styles.stack}>
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <motion.div
            key={item.key}
            layout
            className={`glass-2 ${styles.toast}`}
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            {item.kind === 'open' ? (
              <>
                <span>
                  <b>{nameOf(item.fromId)}</b> mengajak high five
                </span>
                <button type="button" className={styles.action} onClick={() => onRespond(item.fromId)}>
                  <AnimatedEmoji name="high-five" size={22} />
                  High five!
                </button>
              </>
            ) : (
              <span>Sudah disambut {item.by}</span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
