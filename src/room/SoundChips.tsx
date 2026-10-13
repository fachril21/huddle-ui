import { AnimatePresence, motion } from 'motion/react'
import { AnimatedEmoji } from '../emoji/AnimatedEmoji'
import { SOUND_BY_ID } from '../audio/soundboardSounds'
import type { Participant, SoundPlay } from '../state/types'
import styles from './SoundChips.module.css'

/** Up to 3 chips at bottom-center naming who is playing what, for as long as the sound lasts (Design.md 12.4). */
export function SoundChips({ plays, participants }: { plays: readonly SoundPlay[]; participants: readonly Participant[] }) {
  return (
    <div className={styles.stack} aria-live="polite">
      <AnimatePresence initial={false}>
        {plays.map((p) => {
          const sound = SOUND_BY_ID[p.soundId]
          const who = participants.find((x) => x.id === p.fromId)?.name ?? ''
          if (!sound) return null
          return (
            <motion.div
              key={p.id}
              layout
              className={`glass-1 ${styles.chip}`}
              initial={{ opacity: 0, y: 10, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            >
              <AnimatedEmoji name={sound.emoji} size={26} />
              <span>
                <b>{who}</b> memutar <i>{sound.name}</i>
              </span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
