import { AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, Dispatch } from 'react'
import type { RoomAction } from '../state/roomReducer'
import { SELF_ID } from '../state/types'
import type { DockToggle, ReactionName, RoomState } from '../state/types'
import { useVoiceEngine, useVoiceSnapshot } from '../voice/VoiceContext'
import { Ambient } from './Ambient'
import { AnnouncementBanner } from './AnnouncementBanner'
import { ClosingScreen } from './ClosingScreen'
import { Dock } from './Dock'
import { GridPager } from './GridPager'
import { HighFiveStage } from './HighFiveStage'
import { HighFiveToasts } from './HighFiveToasts'
import { useHighFive } from './hooks/useHighFive'
import { usePaging } from './hooks/usePaging'
import { usePolls } from './hooks/usePolls'
import { useSoundboard } from './hooks/useSoundboard'
import { InfoPill } from './InfoPill'
import { LeaveMenu } from './LeaveMenu'
import { MorePopover } from './MorePopover'
import { MutedBanner } from './MutedBanner'
import { NoticeStack } from './NoticeStack'
import { PanelPill } from './PanelPill'
import { PollToast } from './PollToast'
import { ReactionLayer } from './ReactionLayer'
import { BURST_LIMIT, BURST_WINDOW_MS } from './reactions'
import { RecordingConsent } from './RecordingConsent'
import { SidePanel } from './SidePanel'
import { SoundboardPopover } from './SoundboardPopover'
import { SoundChips } from './SoundChips'
import { TileGrid } from './TileGrid'
import { TopBar } from './TopBar'
import { useFx } from './MotionContext'
import styles from './Room.module.css'

const REACTION_X_MIN = 24
const REACTION_X_MAX = 200
/** Side panel width plus its gaps; the tile stage gives this space up while a panel is open */
const PANEL_SPACE = '376px'

interface RoomProps {
  state: RoomState
  dispatch: Dispatch<RoomAction>
}

/** Messages from other people the user has not seen yet (public, or private to them). */
function unreadChatCount(state: RoomState): number {
  return state.chat.messages
    .slice(state.chat.readCount)
    .filter((m) => m.fromId !== SELF_ID && (m.toId === null || m.toId === SELF_ID)).length
}

export function Room({ state, dispatch }: RoomProps) {
  const { fx, reduced } = useFx()
  const engine = useVoiceEngine()
  const voice = useVoiceSnapshot()
  const self = state.participants.find((p) => p.id === SELF_ID)
  const [announcement, setAnnouncement] = useState('')
  const announce = useCallback((text: string) => setAnnouncement(text), [])
  const highFive = useHighFive(state, dispatch, announce)
  const soundboard = useSoundboard(state, dispatch)
  const polls = usePolls(state, dispatch, announce)
  const paging = usePaging(state.participants, voice.speaking, dispatch)
  const sentAt = useRef<number[]>([])
  const hasReactions = state.reactions.length > 0
  const hasNotices = state.notices.length > 0

  useEffect(() => engine.setReducedMotion(reduced), [engine, reduced])

  // Drop expired floating reactions and notice chips
  useEffect(() => {
    if (!hasReactions) return
    const id = window.setInterval(() => dispatch({ type: 'expireReactions', now: performance.now() }), 500)
    return () => window.clearInterval(id)
  }, [hasReactions, dispatch])
  useEffect(() => {
    if (!hasNotices) return
    const id = window.setInterval(() => dispatch({ type: 'expireNotices', now: performance.now() }), 500)
    return () => window.clearInterval(id)
  }, [hasNotices, dispatch])

  // If the host switches soundboard off while its popover is open, close it
  useEffect(() => {
    if (!state.soundboard.allowed) dispatch({ type: 'closeDock', key: 'soundboard' })
  }, [state.soundboard.allowed, dispatch])

  // A role change can remove the Alat host panel from under the user
  const selfRole = self?.role
  const canManage = selfRole === 'Host' || selfRole === 'Co-host'
  useEffect(() => {
    if (state.panel === 'host' && !canManage) dispatch({ type: 'openPanel', panel: null })
  }, [state.panel, canManage, dispatch])

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
  const dismissAnnouncement = useCallback(() => dispatch({ type: 'dismissAnnouncement' }), [dispatch])

  if (!self || !selfRole) return null
  if (state.phase !== 'live') return <ClosingScreen phase={state.phase} onRestart={() => dispatch({ type: 'reset' })} />

  const sharing = state.sharerId !== null
  const shareBlocked = sharing && state.sharerId !== SELF_ID
  const restricted = state.host.restrictShare && !canManage
  const needsConsent = state.host.recording !== 'off' && !canManage && !state.host.consented
  const style = { '--crosstalk': voice.crosstalk ? 1 : 0, '--panel-space': state.panel ? PANEL_SPACE : '0px' } as CSSProperties

  return (
    <div className={styles.room} data-motion={reduced ? 'reduced' : 'full'} data-fx={fx} data-sharing={sharing} style={style}>
      <Ambient />
      <TileGrid
        participants={state.participants}
        offers={state.highFive.offers}
        sharerId={state.sharerId}
        gridPage={paging.page}
        soundPlayers={soundboard.players}
        dispatch={dispatch}
      />
      <TopBar
        recording={state.host.recording}
        locked={state.host.locked}
        leading={paging.pages > 1 && !sharing ? <GridPager page={paging.page} pages={paging.pages} speakingElsewhere={paging.speakingElsewhere} onPage={paging.setPage} /> : null}
      />
      <AnnouncementBanner announcement={state.host.announcement} onDismiss={dismissAnnouncement} />
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
      <div className={styles.bottomStack}>
        <NoticeStack notices={state.notices} />
        <SoundChips plays={soundboard.plays} participants={state.participants} />
      </div>
      <InfoPill />
      <AnimatePresence>
        {state.panel && <SidePanel key="panel" panel={state.panel} state={state} selfRole={selfRole} dispatch={dispatch} onClose={() => dispatch({ type: 'openPanel', panel: null })} />}
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
        shareDisabledReason={restricted ? 'Hanya host dan co-host yang bisa berbagi layar' : shareBlocked ? 'Peserta lain sedang berbagi layar. Tunggu sampai selesai.' : undefined}
        highFiveActive={highFive.active}
        highFiveDisabledReason={highFive.disabledReason}
        soundboardDisabledReason={soundboard.disabledReason}
        soundboard={<SoundboardPopover key="soundboard" lastPlayAt={soundboard.selfLastPlayAt} onPlay={soundboard.onPlay} />}
        more={<MorePopover key="more" fx={state.settings.fx} onFx={(next) => dispatch({ type: 'setFx', fx: next })} />}
        leave={
          <LeaveMenu
            key="leave"
            canEndForAll={selfRole === 'Host'}
            onLeave={() => dispatch({ type: 'leave', phase: 'left' })}
            onEnd={() => dispatch({ type: 'leave', phase: 'ended' })}
          />
        }
      />
      <PanelPill
        active={state.panel}
        participantCount={state.participants.length}
        unreadChat={unreadChatCount(state)}
        pendingPoll={polls.pendingBadge}
        showHost={canManage}
        hostBadge={state.host.waiting.length}
        onSelect={(panel) => dispatch({ type: 'togglePanel', panel })}
      />
      {needsConsent && <RecordingConsent onAgree={() => dispatch({ type: 'recordingConsent' })} onLeave={() => dispatch({ type: 'leave', phase: 'left' })} />}
    </div>
  )
}
