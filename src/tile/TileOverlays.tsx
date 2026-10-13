import { RefreshCw, SignalLow } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { AnimatedEmoji } from '../emoji/AnimatedEmoji'
import type { Participant } from '../state/types'
import styles from './TileOverlays.module.css'

interface OverlayProps {
  participant: Participant
  tileW: number
  tileH: number
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

/** Geometry shared by emoji overlays (Design.md 8.1, 9.1). */
function geometry(p: Participant, tileW: number, tileH: number) {
  const narrow = tileW < 200
  const emoji = narrow ? 48 : Math.round(clamp(tileH * 0.3, 56, 112))
  const avatar = clamp(tileH * 0.28, 56, 120)
  return { narrow, emoji, avatar, camOn: p.camOn }
}

/** Raised hand: big waving emoji left of the avatar, rising from below with a spring, plus the queue chip. */
export function HandOverlay({ participant, tileW, tileH }: OverlayProps) {
  const g = geometry(participant, tileW, tileH)
  const left = g.narrow ? 10 : g.camOn ? tileW * 0.14 : tileW / 2 - g.avatar / 2 - g.emoji * 1.1
  const top = g.narrow ? 10 : tileH / 2 - g.emoji / 2

  return (
    <AnimatePresence>
      {participant.hand !== null && (
        <>
          <motion.span
            key="flash"
            className={styles.handFlash}
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            aria-hidden="true"
          />
          <motion.div
            key="hand"
            className={styles.hand}
            style={{ left, top, width: g.emoji }}
            initial={{ y: g.emoji * 0.9, scale: 0.3, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: g.emoji * 0.4, scale: 0.4, opacity: 0, transition: { duration: 0.22 } }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <AnimatedEmoji name="hand-wave" size={g.emoji} />
            <span className={`glass-1 ${styles.queue}`} aria-label={`Antrean tangan ${participant.hand}`}>
              {participant.hand}
            </span>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/** AFK / BRB: status emoji beside the avatar. The tile itself is dimmed by Tile. */
export function StatusOverlay({ participant, tileW, tileH }: OverlayProps) {
  const g = geometry(participant, tileW, tileH)
  const size = g.narrow ? 36 : 56
  const left = g.narrow ? tileW - size - 10 : g.camOn ? tileW * 0.86 - size : tileW / 2 + g.avatar / 2 + size * 0.15
  const top = g.narrow ? 10 : tileH / 2 - size / 2

  return (
    <AnimatePresence mode="popLayout">
      {participant.status !== 'none' && (
        <motion.div
          key={participant.status}
          className={styles.status}
          style={{ left, top }}
          initial={{ scale: 0.4, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.18 } }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <AnimatedEmoji name={participant.status === 'afk' ? 'sleep' : 'coffee'} size={size} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Poor connection: dashed rose border pulsing under 1 Hz. Reconnecting: light sweep plus a badge. */
export function ConnectionOverlay({ participant }: { participant: Participant }) {
  const { connection } = participant
  return (
    <>
      {connection === 'poor' && <div className={styles.poor} aria-hidden="true" />}
      {connection === 'reconnecting' && (
        <>
          <div className={styles.shimmer} aria-hidden="true" />
          <div className={`glass-1 ${styles.reconnecting}`} role="status">
            <RefreshCw size={14} strokeWidth={1.75} aria-hidden="true" className={styles.spin} />
            Menyambung ulang
          </div>
        </>
      )}
    </>
  )
}

export function PoorSignalIcon() {
  return <SignalLow size={14} strokeWidth={1.75} aria-label="Koneksi buruk" role="img" className={styles.poorIcon} />
}
