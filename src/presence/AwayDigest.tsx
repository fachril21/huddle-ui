import { MessageSquare } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { Dispatch } from 'react'
import shared from '../breakout/breakout.module.css'
import type { RoomAction } from '../state/actions'
import { SELF_ID } from '../state/types'
import type { RoomState } from '../state/types'
import { spanText } from './presence'
import styles from './presence.module.css'

const SHOW_MS = 14_000
const SPRING = { type: 'spring', stiffness: 320, damping: 28 } as const

interface Digest {
  key: number
  /** how long they were gone */
  gone: string
  mentions: number
  polls: number
}

interface Mark {
  at: number
  messages: number
  pollId: number
}

const latestPollId = (state: RoomState) => Math.max(0, ...state.polls.map((p) => p.id))

/** On the way back from a break: what was said to you and what was asked of you while you were gone. */
export function AwayDigest({ state, dispatch }: { state: RoomState; dispatch: Dispatch<RoomAction> }) {
  const away = state.participants.find((p) => p.id === SELF_ID)?.status !== 'none'
  const mark = useRef<Mark | null>(null)
  const [digest, setDigest] = useState<Digest | null>(null)

  useEffect(() => {
    if (away && !mark.current) {
      mark.current = { at: performance.now(), messages: state.chat.messages.length, pollId: latestPollId(state) }
      return
    }
    if (away || !mark.current) return
    const was = mark.current
    mark.current = null
    const gone = spanText(performance.now() - was.at)
    const mentions = state.chat.messages.slice(was.messages).filter((m) => m.fromId !== SELF_ID && (m.toId === SELF_ID || m.text.includes('@Anda'))).length
    const polls = state.polls.filter((p) => p.id > was.pollId).length
    if (mentions + polls === 0) {
      dispatch({ type: 'notice', text: gone === 'baru saja' ? 'Selamat datang kembali' : `Selamat datang kembali, Anda pergi ${gone}`, now: performance.now() })
      return
    }
    setDigest((d) => ({ key: (d?.key ?? 0) + 1, gone, mentions, polls }))
    // only the change of being away matters here, not every later message
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [away])

  useEffect(() => {
    if (!digest) return
    const id = window.setTimeout(() => setDigest(null), SHOW_MS)
    return () => window.clearTimeout(id)
  }, [digest])

  const open = (panel: 'chat' | 'polling') => {
    dispatch({ type: 'openPanel', panel })
    setDigest(null)
  }

  return (
    <AnimatePresence>
      {digest && (
        <motion.div
          key={digest.key}
          className={`glass-2 ${styles.digest}`}
          role="status"
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, transition: { duration: 0.18 } }}
          transition={SPRING}
        >
          <span className={styles.text}>
            Selama Anda pergi{digest.gone === 'baru saja' ? '' : ` (${digest.gone})`}
            <ul>
              {digest.mentions > 0 && (
                <li>
                  <b>{digest.mentions}</b> pesan untuk Anda
                </li>
              )}
              {digest.polls > 0 && (
                <li>
                  <b>{digest.polls}</b> polling baru
                </li>
              )}
            </ul>
          </span>
          <button type="button" className={shared.quiet} onClick={() => setDigest(null)}>
            Tutup
          </button>
          {digest.mentions > 0 ? (
            <button type="button" className={shared.primary} onClick={() => open('chat')}>
              <MessageSquare size={16} strokeWidth={1.75} aria-hidden="true" />
              Lihat chat
            </button>
          ) : (
            <button type="button" className={shared.primary} onClick={() => open('polling')}>
              Lihat polling
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
