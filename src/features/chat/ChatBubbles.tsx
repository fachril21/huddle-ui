import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../room/useReducedMotion'
import type { ChatMessage, Participant } from '../../state/types'
import { incomingMessages, pushBubbles } from './bubbleQueue'
import styles from './ChatBubbles.module.css'

/** How long a bubble stays; hovering or focusing it pauses the countdown. */
const BUBBLE_MS = 6000

interface Bubble {
  readonly id: number
  readonly fromId: string
  readonly text: string
  readonly isPrivate: boolean
}

interface ChatBubblesProps {
  messages: readonly ChatMessage[]
  people: readonly Participant[]
  /** The Chat panel already shows every message, so bubbles stay away while it is open */
  chatOpen: boolean
  onOpenChat: () => void
}

/** Meet-style bubbles for new chat messages, stacked at the bottom-left above the info pill. */
export function ChatBubbles({ messages, people, chatOpen, onOpenChat }: ChatBubblesProps) {
  const [bubbles, setBubbles] = useState<readonly Bubble[]>([])
  const lastSeenId = useRef(messages.at(-1)?.id ?? 0)
  const reduced = useReducedMotion()

  useEffect(() => {
    const fresh = incomingMessages(messages, lastSeenId.current)
    lastSeenId.current = messages.at(-1)?.id ?? lastSeenId.current
    if (chatOpen || !fresh.length) return
    setBubbles((current) => pushBubbles(current, fresh.map((m) => ({ id: m.id, fromId: m.fromId, text: m.text, isPrivate: m.toId !== null }))))
  }, [messages, chatOpen])

  useEffect(() => {
    if (chatOpen) setBubbles([])
  }, [chatOpen])

  const dismiss = (id: number) => setBubbles((current) => current.filter((b) => b.id !== id))

  return (
    <div className={styles.stack} aria-live="polite" aria-relevant="additions">
      <AnimatePresence initial={false}>
        {bubbles.map((bubble) => {
          const sender = people.find((p) => p.id === bubble.fromId)
          return (
            <BubbleCard
              key={bubble.id}
              bubble={bubble}
              name={sender?.name ?? 'Peserta'}
              palette={sender?.palette}
              reduced={reduced}
              onOpen={onOpenChat}
              onExpire={() => dismiss(bubble.id)}
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}

interface BubbleCardProps {
  bubble: Bubble
  name: string
  palette: Participant['palette'] | undefined
  reduced: boolean
  onOpen: () => void
  onExpire: () => void
}

function BubbleCard({ bubble, name, palette, reduced, onOpen, onExpire }: BubbleCardProps) {
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const timer = window.setTimeout(onExpire, BUBBLE_MS)
    return () => window.clearTimeout(timer)
  }, [paused, onExpire])

  return (
    <motion.div
      layout={!reduced}
      className={`glass-2 ${styles.bubble}`}
      data-palette={palette}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? { opacity: 0, transition: { duration: 0.12 } } : { opacity: 0, x: -16, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <button type="button" className={styles.main} onClick={onOpen} aria-label={`Pesan dari ${name}${bubble.isPrivate ? ', pribadi' : ''}: ${bubble.text}. Buka chat`}>
        <i className={styles.dot} aria-hidden="true">{name.charAt(0)}</i>
        <span className={styles.body}>
          <span className={styles.name}>
            {name}
            {bubble.isPrivate && <em>Pribadi</em>}
          </span>
          <span className={styles.text}>{bubble.text}</span>
        </span>
      </button>
      <button type="button" className={styles.close} aria-label="Tutup pesan" onClick={onExpire}>
        <X size={14} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </motion.div>
  )
}
