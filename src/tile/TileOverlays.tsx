import { Check, RefreshCw, SignalLow } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { AnimatedEmoji } from '../emoji/AnimatedEmoji'
import type { Participant } from '../state/types'
import styles from './TileOverlays.module.css'

interface OverlayProps {
  participant: Participant
  tileW: number
  tileH: number
}

/** How long the "back" greeting stays on a card */
const WAKE_MS = 2400

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

/**
 * AFK / BRB: the card steps back. A veil settles over it in the status hue (a thin warm rim for BRB, a slow-breathing
 * vignette for AFK), one flash marks the moment, and the status emoji springs in beside the avatar.
 */
export function StatusOverlay({ participant, tileW, tileH }: OverlayProps) {
  const g = geometry(participant, tileW, tileH)
  const size = g.narrow ? 36 : 56
  // a narrow card has no room beside the avatar: the emoji sits at the top, clear of the hand, the pin and the mic mark
  const left = g.narrow ? (tileW - size) / 2 : g.camOn ? tileW * 0.86 - size : tileW / 2 + g.avatar / 2 + size * 0.15
  const top = g.narrow ? 10 : tileH / 2 - size / 2
  const { status, name } = participant

  return (
    <>
      <AnimatePresence>
        {status !== 'none' && (
          <motion.span key={`veil-${status}`} className={styles.veil} data-status={status} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} aria-hidden="true">
            <span className={styles.settle} />
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence mode="popLayout">
        {status !== 'none' && (
          <motion.div
            key={status}
            className={styles.status}
            style={{ left, top }}
            initial={{ scale: 0.4, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: -10, transition: { duration: 0.22 } }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <AnimatedEmoji name={status === 'afk' ? 'sleep' : 'coffee'} size={size} />
            <span className="sr-only" role="status">{`${name} ${status === 'afk' ? 'AFK' : 'BRB'}`}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/** Back from a break: the card lights up once and says so for a moment. */
export function WakeOverlay({ participant }: { participant: Participant }) {
  const { status, name } = participant
  const previous = useRef(status)
  const [wake, setWake] = useState(0)

  useEffect(() => {
    const was = previous.current
    previous.current = status
    if (was === 'none' || status !== 'none') return
    setWake((k) => k + 1)
    const id = window.setTimeout(() => setWake(0), WAKE_MS)
    return () => window.clearTimeout(id)
  }, [status])

  return (
    <AnimatePresence>
      {wake > 0 && (
        <motion.div key={wake} className={styles.wake} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
          <span className={styles.wakeRing} aria-hidden="true" />
          <motion.span
            className={`glass-1 ${styles.welcome}`}
            role="status"
            initial={{ y: -8, scale: 0.9, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <Check size={14} strokeWidth={2} aria-hidden="true" />
            {`${name} kembali`}
          </motion.span>
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

interface OfferOverlayProps extends OverlayProps {
  /** Open high-five offer from this participant, if any */
  offer: { startedAt: number; expiresAt: number } | null
}

const RING_R = 46
const RING_C = 2 * Math.PI * RING_R

/** High-five invitation: reaching hand with a 6s countdown ring and a gentle 1 Hz border pulse (Design.md 11.4). */
export function OfferOverlay({ participant, tileW, tileH, offer }: OfferOverlayProps) {
  const g = geometry(participant, tileW, tileH)
  const size = g.emoji
  const handUp = participant.hand !== null
  // The raised-hand emoji owns the left slot; the offer then sits on the right of the avatar.
  const left = g.narrow ? 10 : handUp ? tileW / 2 + g.avatar / 2 + size * 0.1 : g.camOn ? tileW * 0.14 : tileW / 2 - g.avatar / 2 - size * 1.1
  const top = g.narrow ? 10 : tileH / 2 - size / 2
  const duration = offer ? (offer.expiresAt - offer.startedAt) / 1000 : 6

  return (
    <AnimatePresence>
      {offer && (
        <>
          <span key="pulse" className={styles.offerPulse} aria-hidden="true" />
          <motion.div
            key="offer"
            className={styles.offer}
            style={{ left, top, width: size, height: size }}
            initial={{ y: size * 0.9, scale: 0.3, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, rotate: 25, scale: 0.85, opacity: 0, transition: { duration: 0.35 } }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <svg className={styles.countdown} viewBox="0 0 100 100" aria-hidden="true">
              <circle className={styles.countdownTrack} cx="50" cy="50" r={RING_R} />
              <circle
                className={styles.countdownArc}
                cx="50"
                cy="50"
                r={RING_R}
                strokeDasharray={RING_C}
                style={{ animationDuration: `${duration}s` }}
              />
            </svg>
            <span className={styles.offerEmoji}>
              <AnimatedEmoji name="hand-reach" size={Math.round(size * 0.66)} />
            </span>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
