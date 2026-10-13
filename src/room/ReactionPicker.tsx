import { Handshake } from 'lucide-react'
import { motion } from 'motion/react'
import { AnimatedEmoji } from '../emoji/AnimatedEmoji'
import type { ReactionName } from '../state/types'
import { REACTIONS } from './reactions'
import styles from './ReactionPicker.module.css'

interface ReactionPickerProps {
  onReact: (name: ReactionName) => void
  onHighFive: () => void
}

/** Glass-2 popover above the Reaction button. Stays open so reactions can be sent in a row. */
export function ReactionPicker({ onReact, onHighFive }: ReactionPickerProps) {
  return (
    <motion.div
      className={`glass-2 ${styles.picker}`}
      role="group"
      aria-label="Pilih reaction"
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97, transition: { duration: 0.12 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
    >
      <div className={styles.row}>
        {REACTIONS.map((r) => (
          <button key={r.name} type="button" className={styles.emoji} aria-label={r.label} onClick={() => onReact(r.name)}>
            <AnimatedEmoji name={r.emoji} size={34} />
          </button>
        ))}
      </div>
      <button type="button" className={styles.highFive} onClick={onHighFive}>
        <Handshake size={18} strokeWidth={1.75} aria-hidden="true" />
        Ajak high five
      </button>
    </motion.div>
  )
}
