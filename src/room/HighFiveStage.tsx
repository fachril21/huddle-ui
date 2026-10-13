import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { playClap } from '../audio/effectSounds'
import { AnimatedEmoji } from '../emoji/AnimatedEmoji'
import type { HighFiveMatch, Participant } from '../state/types'
import { useFx } from './MotionContext'
import styles from './HighFiveStage.module.css'

/** At most two center-screen animations at once; the rest wait their turn (Design.md 11.7). */
const MAX_PLAYING = 2

const FLY_MS = 450
const HIT_MS = 650
const FADE_MS = 500
const CHIP_MS = 1200
const HAND_PX = 160
const PARTICLES = 24

type Phase = 'fly' | 'hit' | 'fade' | 'chip'

interface StageProps {
  matches: readonly HighFiveMatch[]
  participants: readonly Participant[]
  /** A shared screen is up: shrink the center animation by 25% */
  sharing: boolean
  onDone: (id: number) => void
}

export function HighFiveStage({ matches, participants, sharing, onDone }: StageProps) {
  return (
    <div className={styles.stage} aria-hidden="true">
      {matches.slice(0, MAX_PLAYING).map((m, slot) => {
        const a = participants.find((p) => p.id === m.aId)
        const b = participants.find((p) => p.id === m.bId)
        if (!a || !b) return null
        return <Match key={m.id} match={m} slot={slot} a={a} b={b} scale={sharing ? 0.75 : 1} onDone={onDone} />
      })}
    </div>
  )
}

interface MatchProps {
  match: HighFiveMatch
  slot: number
  a: Participant
  b: Participant
  scale: number
  onDone: (id: number) => void
}

/** Where a participant's reaching hand sits right now (left part of their tile). */
function startPoint(id: string): { x: number; y: number } {
  const el = document.querySelector(`[data-tile-id="${id}"]`)
  if (!el) return { x: window.innerWidth / 2, y: window.innerHeight }
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width * 0.3, y: r.top + r.height / 2 }
}

function Match({ match, slot, a, b, scale, onDone }: MatchProps) {
  const { reduced, fx } = useFx()
  const [phase, setPhase] = useState<Phase>('fly')
  // Keep the latest callback without restarting the timeline when the parent re-renders
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const start = useMemo(() => ({ a: startPoint(a.id), b: startPoint(b.id) }), [a.id, b.id])
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2 - 30 + slot * 150 * scale
  const size = HAND_PX * scale
  const gap = size * 0.28

  useEffect(() => {
    const timers: number[] = []
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))
    const hit = reduced ? 0 : FLY_MS
    at(hit, () => {
      setPhase('hit')
      playClap()
      document.documentElement.dataset.hfBoost = 'true'
    })
    at(hit + 250, () => {
      delete document.documentElement.dataset.hfBoost
    })
    at(hit + HIT_MS, () => setPhase('fade'))
    at(hit + HIT_MS + FADE_MS, () => setPhase('chip'))
    at(hit + HIT_MS + FADE_MS + CHIP_MS, () => doneRef.current(match.id))
    return () => {
      timers.forEach(window.clearTimeout)
      delete document.documentElement.dataset.hfBoost
    }
  }, [match.id, reduced])

  const arc = (from: { x: number; y: number }, side: -1 | 1) => ({
    x: [from.x, (from.x + cx) / 2, cx + side * gap],
    y: [from.y, Math.min(from.y, cy) - 140 * scale, cy],
    scale: [0.4, 0.8, 1],
  })
  const flying = phase === 'fly' && !reduced

  return (
    <>
      {flying && (
        <>
          <Hand pos={arc(start.a, -1)} size={size} flip={false} />
          <Hand pos={arc(start.b, 1)} size={size} flip />
        </>
      )}
      <AnimatePresence>
        {(phase === 'hit' || phase === 'fade') && fx !== 'off' && (
          <motion.div
            key="burst"
            className={styles.burst}
            style={{ left: cx, top: cy }}
            initial={{ scale: reduced ? 1 : 0.5, opacity: 0 }}
            animate={phase === 'fade' ? { scale: 0.7, opacity: 0 } : { scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={phase === 'fade' ? { duration: FADE_MS / 1000, ease: 'easeIn' } : { type: 'spring', stiffness: 420, damping: 14 }}
          >
            <AnimatedEmoji name="high-five" size={Math.round(size * 1.25)} />
          </motion.div>
        )}
      </AnimatePresence>
      {phase === 'hit' && !reduced && <Impact cx={cx} cy={cy} a={a} b={b} scale={scale} sparks={fx === 'full'} />}
      <AnimatePresence>
        {phase === 'chip' && (
          <motion.div
            key="chip"
            className={`glass-2 ${styles.chip}`}
            style={{ left: cx, top: cy + size * 0.75 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {a.name} × {b.name}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Hand({ pos, size, flip }: { pos: { x: number[]; y: number[]; scale: number[] }; size: number; flip: boolean }) {
  return (
    <motion.div
      className={styles.hand}
      style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}
      initial={{ x: pos.x[0], y: pos.y[0], scale: pos.scale[0], opacity: 0 }}
      animate={{ x: pos.x, y: pos.y, scale: pos.scale, opacity: 1 }}
      transition={{ duration: FLY_MS / 1000, ease: [0.2, 0.8, 0.2, 1], times: [0, 0.5, 1], opacity: { duration: 0.12 } }}
    >
      <span className={styles.mirror} data-flip={flip}>
        <AnimatedEmoji name="hand-reach" size={Math.round(size * 0.8)} />
      </span>
    </motion.div>
  )
}

/** Shockwave rings (one per palette) and aurora sparks around the point of impact. */
function Impact({ cx, cy, a, b, scale, sparks: withSparks }: { cx: number; cy: number; a: Participant; b: Participant; scale: number; sparks: boolean }) {
  const sparks = useMemo(
    () =>
      Array.from({ length: withSparks ? PARTICLES : 0 }, (_, i) => ({
        angle: (i / PARTICLES) * Math.PI * 2 + (Math.random() - 0.5) * 0.2,
        dist: (110 + Math.random() * 150) * scale,
        owner: i % 2 === 0 ? a : b,
      })),
    [a, b, scale, withSparks],
  )
  return (
    <div className={styles.impact} style={{ left: cx, top: cy }}>
      <motion.span
        className={styles.ring}
        data-palette={a.palette}
        initial={{ scale: 0.3, opacity: 0.9 }}
        animate={{ scale: 3 * scale, opacity: 0 }}
        transition={{ duration: 0.65, ease: [0.2, 0.8, 0.2, 1] }}
      />
      <motion.span
        className={`${styles.ring} ${styles.ringB}`}
        data-palette={b.palette}
        initial={{ scale: 0.3, opacity: 0.9 }}
        animate={{ scale: 2.4 * scale, opacity: 0 }}
        transition={{ duration: 0.65, delay: 0.08, ease: [0.2, 0.8, 0.2, 1] }}
      />
      {sparks.map((s, i) => (
        <motion.i
          key={i}
          className={styles.spark}
          data-palette={s.owner.palette}
          data-alt={i % 4 < 2}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: Math.cos(s.angle) * s.dist, y: Math.sin(s.angle) * s.dist, scale: 0, opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        />
      ))}
    </div>
  )
}
