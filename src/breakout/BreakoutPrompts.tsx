import { DoorOpen, HandHelping } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { Dispatch } from 'react'
import type { RoomAction } from '../state/actions'
import { SELF_ID } from '../state/types'
import type { RoomState } from '../state/types'
import shared from './breakout.module.css'
import { TIMER_WARNING_MS, invitationFor, isLive, isManager, roomName, timeLeftMs, toneOfRoom } from './rooms'
import styles from './BreakoutPrompts.module.css'

interface BreakoutPromptsProps {
  state: RoomState
  now: number
  dispatch: Dispatch<RoomAction>
}

const SPRING = { type: 'spring', stiffness: 320, damping: 28 } as const
const ENTER = { opacity: 0, y: 12, scale: 0.96 }
const EXIT = { opacity: 0, y: 6, transition: { duration: 0.18 } }

/**
 * Everything the rooms say to you without being asked: an invitation, a room asking for help, and the one-minute warning.
 */
export function BreakoutPrompts({ state, now, dispatch }: BreakoutPromptsProps) {
  const b = state.breakout
  const self = state.participants.find((p) => p.id === SELF_ID)
  const [dismissed, setDismissed] = useState<string | null>(null)
  const warned = useRef<number | null>(null)

  // a minute before the timer runs out
  const left = timeLeftMs(b, now)
  useEffect(() => {
    if (b.phase !== 'open' || b.closesAt === null || left === null || left > TIMER_WARNING_MS || warned.current === b.closesAt) return
    warned.current = b.closesAt
    dispatch({ type: 'notice', text: 'Ruang diskusi ditutup dalam 1 menit', now: performance.now() })
  }, [b.phase, b.closesAt, left, dispatch])

  if (!self || !isLive(b)) return null

  const target = invitationFor(b, SELF_ID)
  const inviteKey = target ? `${b.openedAt}:${target}` : null
  const showInvite = target !== null && inviteKey !== dismissed
  const [ask] = isManager(self) ? b.help : []

  return (
    <>
      <AnimatePresence>
        {showInvite && target && (
          <motion.div key="invite" className={`glass-2 ${shared.tone} ${styles.toast}`} data-tone={toneOfRoom(b, target)} role="status" initial={ENTER} animate={{ opacity: 1, y: 0, scale: 1 }} exit={EXIT} transition={SPRING}>
            <span className={shared.mark} aria-hidden="true">
              <DoorOpen size={16} strokeWidth={1.75} />
            </span>
            <span className={styles.text}>
              Anda ditempatkan di <b>{roomName(b, target)}</b>
            </span>
            <button type="button" className={shared.quiet} onClick={() => setDismissed(inviteKey)}>
              Nanti
            </button>
            <button type="button" className={shared.primary} onClick={() => dispatch({ type: 'breakoutJoin', id: SELF_ID, roomId: target, now: performance.now() })}>
              Masuk
            </button>
          </motion.div>
        )}
        {ask && (
          <motion.div key="help" className={`glass-2 ${shared.tone} ${styles.toast}`} data-tone={toneOfRoom(b, ask.roomId)} role="status" initial={ENTER} animate={{ opacity: 1, y: 0, scale: 1 }} exit={EXIT} transition={SPRING}>
            <span className={shared.mark} aria-hidden="true">
              <HandHelping size={16} strokeWidth={1.75} />
            </span>
            <span className={styles.text}>
              <b>{roomName(b, ask.roomId)}</b> meminta bantuan
            </span>
            <button type="button" className={shared.quiet} onClick={() => dispatch({ type: 'breakoutHelpDone', roomId: ask.roomId })}>
              Selesai
            </button>
            <button
              type="button"
              className={shared.primary}
              onClick={() => {
                dispatch({ type: 'breakoutJoin', id: SELF_ID, roomId: ask.roomId, now: performance.now() })
                dispatch({ type: 'breakoutHelpDone', roomId: ask.roomId })
              }}
            >
              Gabung
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
