import { motion } from 'motion/react'
import { AnimatedEmoji } from '../emoji/AnimatedEmoji'
import type { Participant, ReactionItem } from '../state/types'
import { REACTION_BY_NAME } from './reactions'
import { useReducedMotion } from './useReducedMotion'
import styles from './ReactionLayer.module.css'

const RISE_PX = 360
const FLOAT_S = 3.6

/** Emoji that float up from the lower-left, above the dock (Design.md 10.2). */
export function ReactionLayer({ reactions, participants }: { reactions: readonly ReactionItem[]; participants: readonly Participant[] }) {
  const reduced = useReducedMotion()
  return (
    <div className={styles.layer} aria-hidden="true">
      {reactions.map((r) => {
        const sender = participants.find((p) => p.id === r.senderId)?.name ?? ''
        return (
          <motion.div
            key={r.id}
            className={styles.item}
            style={{ left: r.x }}
            initial={{ y: 0, opacity: 0, scale: 0.6 }}
            animate={
              reduced
                ? { y: -40, opacity: [0, 1, 1, 0], scale: 1 }
                : {
                    y: -RISE_PX,
                    x: [0, 14, -14, 14, -10, 0],
                    scale: [0.6, 1, 1, 0.9],
                    opacity: [0, 1, 1, 0],
                  }
            }
            transition={{
              duration: FLOAT_S,
              ease: 'linear',
              opacity: { duration: FLOAT_S, times: [0, 0.08, 0.84, 1] },
              scale: { duration: FLOAT_S, times: [0, 0.12, 0.6, 1], ease: 'easeOut' },
            }}
          >
            <AnimatedEmoji name={REACTION_BY_NAME[r.name].emoji} size={56} />
            <span className={`glass-1 ${styles.chip}`}>
              {sender}
              {r.count > 1 && <b className={styles.count}> ×{r.count}</b>}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
