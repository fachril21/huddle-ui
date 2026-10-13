import { useCallback, useEffect, useRef } from 'react'
import type { CSSProperties, Dispatch } from 'react'
import type { RoomAction } from '../state/roomReducer'
import { SELF_ID } from '../state/types'
import type { DockToggle, ReactionName, RoomState } from '../state/types'
import { useVoiceEngine, useVoiceSnapshot } from '../voice/VoiceContext'
import { Ambient } from './Ambient'
import { Dock } from './Dock'
import { InfoPill } from './InfoPill'
import { MutedBanner } from './MutedBanner'
import { PanelPill } from './PanelPill'
import { ReactionLayer } from './ReactionLayer'
import { BURST_LIMIT, BURST_WINDOW_MS } from './reactions'
import { TileGrid } from './TileGrid'
import { TopBar } from './TopBar'
import { useReducedMotion } from './useReducedMotion'
import styles from './Room.module.css'

/** Mock unread chat count: the private message from Dewi mentioning @Anda (PRD 11.4). */
const MOCK_UNREAD_CHAT = 1
const REACTION_X_MIN = 24
const REACTION_X_MAX = 200

interface RoomProps {
  state: RoomState
  dispatch: Dispatch<RoomAction>
}

export function Room({ state, dispatch }: RoomProps) {
  const reducedMotion = useReducedMotion()
  const engine = useVoiceEngine()
  const voice = useVoiceSnapshot()
  const self = state.participants.find((p) => p.id === SELF_ID)
  const sentAt = useRef<number[]>([])
  const hasReactions = state.reactions.length > 0

  useEffect(() => engine.setReducedMotion(reducedMotion), [engine, reducedMotion])

  // Drop expired floating reactions
  useEffect(() => {
    if (!hasReactions) return
    const id = window.setInterval(() => dispatch({ type: 'expireReactions', now: performance.now() }), 500)
    return () => window.clearInterval(id)
  }, [hasReactions, dispatch])

  const onReact = useCallback(
    (name: ReactionName) => {
      const now = performance.now()
      sentAt.current = sentAt.current.filter((t) => now - t < BURST_WINDOW_MS)
      if (sentAt.current.length >= BURST_LIMIT) return
      sentAt.current.push(now)
      const x = REACTION_X_MIN + Math.random() * (REACTION_X_MAX - REACTION_X_MIN)
      dispatch({ type: 'react', senderId: SELF_ID, name, x, now })
    },
    [dispatch],
  )

  const onClose = useCallback((key: DockToggle) => dispatch({ type: 'closeDock', key }), [dispatch])

  if (!self) return null

  const style = { '--crosstalk': voice.crosstalk ? 1 : 0 } as CSSProperties

  return (
    <div className={styles.room} data-motion={reducedMotion ? 'reduced' : 'full'} style={style}>
      <Ambient />
      <TileGrid participants={state.participants} dispatch={dispatch} />
      <TopBar />
      <MutedBanner visible={voice.mutedSpeaking && !self.micOn} onUnmute={() => dispatch({ type: 'setMic', id: SELF_ID, on: true })} />
      <ReactionLayer reactions={state.reactions} participants={state.participants} />
      <InfoPill />
      <Dock
        self={self}
        toggles={state.toggles}
        onToggleMic={() => dispatch({ type: 'toggleMic', id: SELF_ID })}
        onToggleCam={() => dispatch({ type: 'toggleCam', id: SELF_ID })}
        onToggleHand={() => dispatch({ type: 'toggleHand', id: SELF_ID })}
        onToggle={(key) => dispatch({ type: 'toggleDock', key })}
        onClose={onClose}
        onReact={onReact}
        onHighFive={() => dispatch({ type: 'toggleDock', key: 'highFive' })}
      />
      <PanelPill
        active={state.panel}
        participantCount={state.participants.length}
        unreadChat={MOCK_UNREAD_CHAT}
        onSelect={(panel) => dispatch({ type: 'togglePanel', panel })}
      />
    </div>
  )
}
