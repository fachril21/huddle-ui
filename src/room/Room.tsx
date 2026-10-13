import { AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, Dispatch } from 'react'
import type { RoomAction } from '../state/roomReducer'
import { SELF_ID } from '../state/types'
import type { DockToggle, ReactionName, RoomState } from '../state/types'
import { useVoiceEngine, useVoiceSnapshot } from '../voice/VoiceContext'
import { Ambient } from './Ambient'
import { Dock } from './Dock'
import { HighFiveStage } from './HighFiveStage'
import { HighFiveToasts } from './HighFiveToasts'
import { useHighFive } from './hooks/useHighFive'
import { usePolls } from './hooks/usePolls'
import { useSoundboard } from './hooks/useSoundboard'
import { InfoPill } from './InfoPill'
import { MutedBanner } from './MutedBanner'
import { PanelPill } from './PanelPill'
import { PollToast } from './PollToast'
import { ReactionLayer } from './ReactionLayer'
import { BURST_LIMIT, BURST_WINDOW_MS } from './reactions'
import { SidePanel } from './SidePanel'
import { SoundboardPopover } from './SoundboardPopover'
import { SoundChips } from './SoundChips'
import { TileGrid } from './TileGrid'
import { TopBar } from './TopBar'
import { useReducedMotion } from './useReducedMotion'
import styles from './Room.module.css'

/** Mock unread chat count: the private message from Dewi mentioning @Anda (PRD 11.4). */
const MOCK_UNREAD_CHAT = 1
const REACTION_X_MIN = 24
const REACTION_X_MAX = 200
/** Side panel width plus its gaps; the tile stage gives this space up while a panel is open */
const PANEL_SPACE = '376px'

interface RoomProps {
  state: RoomState
  dispatch: Dispatch<RoomAction>
}

export function Room({ state, dispatch }: RoomProps) {
  const reducedMotion = useReducedMotion()
  const engine = useVoiceEngine()
  const voice = useVoiceSnapshot()
  const self = state.participants.find((p) => p.id === SELF_ID)
  const [announcement, setAnnouncement] = useState('')
  const announce = useCallback((text: string) => setAnnouncement(text), [])
  const highFive = useHighFive(state, dispatch, announce)
  const soundboard = useSoundboard(state, dispatch)
  const polls = usePolls(state, dispatch, announce)
  const sentAt = useRef<number[]>([])
  const hasReactions = state.reactions.length > 0

  useEffect(() => engine.setReducedMotion(reducedMotion), [engine, reducedMotion])

  // Drop expired floating reactions
  useEffect(() => {
    if (!hasReactions) return
    const id = window.setInterval(() => dispatch({ type: 'expireReactions', now: performance.now() }), 500)
    return () => window.clearInterval(id)
  }, [hasReactions, dispatch])

  // If the host switches soundboard off while its popover is open, close it
  useEffect(() => {
    if (!state.soundboard.allowed) dispatch({ type: 'closeDock', key: 'soundboard' })
  }, [state.soundboard.allowed, dispatch])

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

  const sharing = state.sharerId !== null
  const style = { '--crosstalk': voice.crosstalk ? 1 : 0, '--panel-space': state.panel ? PANEL_SPACE : '0px' } as CSSProperties

  return (
    <div className={styles.room} data-motion={reducedMotion ? 'reduced' : 'full'} data-sharing={sharing} style={style}>
      <Ambient />
      <TileGrid participants={state.participants} offers={state.highFive.offers} sharerId={state.sharerId} soundPlayers={soundboard.players} dispatch={dispatch} />
      <TopBar />
      <MutedBanner visible={voice.mutedSpeaking && !self.micOn} onUnmute={() => dispatch({ type: 'setMic', id: SELF_ID, on: true })} />
      <HighFiveToasts
        offers={state.highFive.offers}
        claims={state.highFive.claims}
        participants={state.participants}
        onRespond={(fromId) => dispatch({ type: 'hfRespond', fromId, byId: SELF_ID, now: performance.now() })}
      />
      <PollToast
        question={polls.toastQuestion}
        onVote={() => {
          polls.dismissToast()
          dispatch({ type: 'openPanel', panel: 'polling' })
        }}
      />
      <HighFiveStage matches={state.highFive.matches} participants={state.participants} sharing={sharing} onDone={(id) => dispatch({ type: 'hfMatchDone', id })} />
      <div className="sr-only" aria-live="polite">{announcement}</div>
      <ReactionLayer reactions={state.reactions} participants={state.participants} />
      <SoundChips plays={soundboard.plays} participants={state.participants} />
      <InfoPill />
      <AnimatePresence>
        {state.panel && <SidePanel key="panel" panel={state.panel} state={state} dispatch={dispatch} onClose={() => dispatch({ type: 'openPanel', panel: null })} />}
      </AnimatePresence>
      <Dock
        self={self}
        toggles={state.toggles}
        onToggleMic={() => dispatch({ type: 'toggleMic', id: SELF_ID })}
        onToggleCam={() => dispatch({ type: 'toggleCam', id: SELF_ID })}
        onToggleHand={() => dispatch({ type: 'toggleHand', id: SELF_ID })}
        onToggle={(key) => dispatch({ type: 'toggleDock', key })}
        onClose={onClose}
        onReact={onReact}
        onHighFive={highFive.onHighFive}
        onShare={() => dispatch(state.sharerId === SELF_ID ? { type: 'stopShare' } : { type: 'startShare', id: SELF_ID })}
        shareActive={state.sharerId === SELF_ID}
        shareDisabledReason={sharing && state.sharerId !== SELF_ID ? 'Peserta lain sedang berbagi layar. Tunggu sampai selesai.' : undefined}
        highFiveActive={highFive.active}
        highFiveDisabledReason={highFive.disabledReason}
        soundboardDisabledReason={soundboard.disabledReason}
        soundboard={<SoundboardPopover key="soundboard" lastPlayAt={soundboard.selfLastPlayAt} onPlay={soundboard.onPlay} />}
      />
      <PanelPill
        active={state.panel}
        participantCount={state.participants.length}
        unreadChat={MOCK_UNREAD_CHAT}
        pendingPoll={polls.pendingBadge}
        onSelect={(panel) => dispatch({ type: 'togglePanel', panel })}
      />
    </div>
  )
}
