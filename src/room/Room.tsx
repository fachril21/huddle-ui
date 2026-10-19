import { AudioLines, ChartColumn, DoorOpen, Hand, Handshake, LayoutGrid, Mic, MonitorUp, PenLine, ShieldCheck, UserPlus, Users, Video } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, Dispatch } from 'react'
import type { RoomAction } from '../state/roomReducer'
import { BreakoutPrompts } from '../breakout/BreakoutPrompts'
import { BreakoutSetup } from '../breakout/BreakoutSetup'
import { RoomStrip } from '../breakout/RoomStrip'
import { RoomWash } from '../breakout/RoomWash'
import { invitationFor, isLive, locationOf } from '../breakout/rooms'
import { useBreakoutClock } from '../breakout/useBreakoutClock'
import { MAIN_ROOM, SELF_ID } from '../state/types'
import type { DockToggle, ReactionName, RoomState } from '../state/types'
import { useVoiceEngine, useVoiceSnapshot } from '../voice/VoiceContext'
import { AnnotationProvider, useAnnotationController } from '../features/annotation/AnnotationContext'
import { ChatBubbles } from '../features/chat/ChatBubbles'
import { ClaimHostBanner } from '../features/host/ClaimHostBanner'
import { InvitePopover } from '../features/invite/InvitePopover'
import { buildInviteUrl } from '../features/invite/inviteLink'
import { Flat } from '../mobile/Flat'
import { Sheet } from '../mobile/Sheet'
import { useViewport } from '../mobile/useViewport'
import { Ambient } from './Ambient'
import { AnnouncementBanner } from './AnnouncementBanner'
import { CameraPopover } from './devices/CameraPopover'
import { MicPopover } from './devices/MicPopover'
import { Dock } from './Dock'
import { GridPager } from './GridPager'
import { HighFiveStage } from './HighFiveStage'
import { HighFiveToasts } from './HighFiveToasts'
import { useHighFive } from './hooks/useHighFive'
import { usePaging } from './hooks/usePaging'
import { usePolls } from './hooks/usePolls'
import { useShortcuts } from './hooks/useShortcuts'
import { useSoundboard } from './hooks/useSoundboard'
import { InfoPill } from './InfoPill'
import { LayoutMenu, LayoutOptions } from './LayoutMenu'
import { PAGE_SIZE } from './layoutMath'
import { PHONE_PAGE_SIZE } from './layoutMath.compact'
import { MEETING_CODE, MEETING_TITLE } from './meeting'
import { MobileDock } from './MobileDock'
import type { MoreAction } from './MoreSheet'
import { LeaveMenu } from './LeaveMenu'
import { MorePopover } from './MorePopover'
import { MutedBanner } from './MutedBanner'
import { NoticeStack } from './NoticeStack'
import { GuestRequestToast } from '../features/host/GuestRequestToast'
import { PanelPill } from './PanelPill'
import { QualitySuggestion } from './QualitySuggestion'
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
  /** The meeting as seen from the user's room */
  state: RoomState
  /** The whole meeting, for the Ruang diskusi surfaces */
  all: RoomState
  dispatch: Dispatch<RoomAction>
}

/** Messages from other people the user has not seen yet (public, or private to them). */
function unreadChatCount(state: RoomState): number {
  return state.chat.messages
    .slice(state.chat.readCount)
    .filter((m) => m.fromId !== SELF_ID && (m.toId === null || m.toId === SELF_ID)).length
}

export function Room({ state, all, dispatch }: RoomProps) {
  const { fx, reduced } = useFx()
  const { sizeClass } = useViewport()
  // phone: tall layouts, paging by swipe, the floating self-view. compact: any non-desktop size gets the bottom control bar and sheets.
  const phone = sizeClass === 'phone'
  const compact = sizeClass !== 'desktop'
  const engine = useVoiceEngine()
  const voice = useVoiceSnapshot()
  const self = state.participants.find((p) => p.id === SELF_ID)
  const [announcement, setAnnouncement] = useState('')
  const announce = useCallback((text: string) => setAnnouncement(text), [])
  const highFive = useHighFive(state, dispatch, announce)
  const soundboard = useSoundboard(state, dispatch)
  const polls = usePolls(state, dispatch, announce)
  const breakoutNow = useBreakoutClock(all, dispatch)
  const [setupOpen, setSetupOpen] = useState(false)
  const layoutSettings = state.settings.layout
  const galleryPeople = layoutSettings.hideNoVideo ? state.participants.filter((p) => p.camOn || p.id === SELF_ID) : state.participants
  // Paging only drives the gallery grid; speaker and spotlight page their own strip
  const paging = usePaging(layoutSettings.mode === 'gallery' && galleryPeople.length ? galleryPeople : [], voice.speaking, dispatch, phone ? PHONE_PAGE_SIZE : PAGE_SIZE)
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

  const sharing = state.sharerId !== null
  const shareBlocked = sharing && state.sharerId !== SELF_ID
  const restricted = state.host.restrictShare && !canManage
  const shareDisabledReason = restricted ? 'Hanya host dan co-host yang bisa berbagi layar' : shareBlocked ? 'Peserta lain sedang berbagi layar. Tunggu sampai selesai.' : undefined
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [layoutOpen, setLayoutOpen] = useState(false)
  const toggleLayout = useCallback(() => setLayoutOpen((open) => !open), [])
  const closeLayout = useCallback(() => setLayoutOpen(false), [])
  const toggleInvite = useCallback(() => setInviteOpen((open) => !open), [])
  const closeInvite = useCallback(() => setInviteOpen(false), [])

  // The shortcut list lives in "Lainnya"; it collapses again when that popover closes
  useEffect(() => {
    if (!state.toggles.more) setShortcutsOpen(false)
  }, [state.toggles.more])

  const annotation = useAnnotationController(state, dispatch, canManage)
  const tell = useCallback((text: string) => dispatch({ type: 'notice', text, now: performance.now() }), [dispatch])
  useShortcuts(
    {
      mic: () => dispatch({ type: 'toggleMic', id: SELF_ID }),
      camera: () => dispatch({ type: 'toggleCam', id: SELF_ID }),
      share: () => {
        if (state.sharerId === SELF_ID) dispatch({ type: 'stopShare' })
        else if (shareDisabledReason) tell(shareDisabledReason)
        else dispatch({ type: 'startShare', id: SELF_ID })
      },
      hand: () => dispatch({ type: 'toggleHand', id: SELF_ID }),
      reaction: () => dispatch({ type: 'toggleDock', key: 'reaction' }),
      highFive: highFive.onHighFive,
      soundboard: () => (soundboard.disabledReason ? tell(soundboard.disabledReason) : dispatch({ type: 'toggleDock', key: 'soundboard' })),
      chat: () => dispatch({ type: 'togglePanel', panel: 'chat' }),
      participants: () => dispatch({ type: 'togglePanel', panel: 'peserta' }),
      invite: toggleInvite,
      annotate: () => {
        if (annotation.enabled) annotation.toggleAnnotating()
        else tell(state.sharerId === null ? 'Coret layar tersedia saat ada yang berbagi layar' : 'Host mematikan coret layar untuk peserta')
      },
      layout: toggleLayout,
      help: () => {
        setShortcutsOpen(true)
        if (!state.toggles.more) dispatch({ type: 'toggleDock', key: 'more' })
      },
    },
    { micOn: self?.micOn ?? false, setMic: (on) => dispatch({ type: 'setMic', id: SELF_ID, on }) },
    state.phase === 'live',
  )

  const onClose = useCallback((key: DockToggle) => dispatch({ type: 'closeDock', key }), [dispatch])
  const dismissAnnouncement = useCallback(() => dispatch({ type: 'dismissAnnouncement' }), [dispatch])

  if (!self || !selfRole) return null
  const othersInRoom = state.participants.filter((p) => p.id !== SELF_ID).length
  const recordingOn = state.host.recording !== 'off'
  // once the meeting is over, App swaps this room for the end page
  if (state.phase !== 'live') return null

  const inRoom = isLive(all.breakout) && locationOf(all.breakout, SELF_ID) !== MAIN_ROOM
  const showRuang = canManage || isLive(all.breakout)
  const ruangBadge = canManage ? all.breakout.help.length : invitationFor(all.breakout, SELF_ID) ? 1 : 0
  const canReturnMain = inRoom && (canManage || all.breakout.options.allowReturn || all.breakout.phase === 'closing')
  const needsConsent = state.host.recording !== 'off' && !canManage && !state.host.consented
  const style = { '--crosstalk': voice.crosstalk ? 1 : 0, '--panel-space': state.panel ? PANEL_SPACE : '0px' } as CSSProperties

  const devices = state.settings.devices
  const cameraNode = (
    <CameraPopover
      key="camera"
      quality={state.settings.cameraQuality}
      camOn={self.camOn}
      palette={self.palette}
      devices={devices}
      weakConnection={self.connection !== 'good'}
      phone={phone}
      onQuality={(quality) => dispatch({ type: 'setCameraQuality', quality })}
      onDevice={(id) => dispatch({ type: 'setDevice', kind: 'camera', id })}
      onFlip={() => dispatch({ type: 'flipCamera' })}
      onTurnOn={() => dispatch({ type: 'toggleCam', id: SELF_ID })}
    />
  )
  const micNode = (
    <MicPopover
      key="mic"
      micOn={self.micOn}
      devices={devices}
      onMicDevice={(id) => dispatch({ type: 'setDevice', kind: 'mic', id })}
      onSpeakerDevice={(id) => dispatch({ type: 'setDevice', kind: 'speaker', id })}
      onTurnOn={() => dispatch({ type: 'setMic', id: SELF_ID, on: true })}
    />
  )
  const soundboardNode = <SoundboardPopover key="soundboard" lastPlayAt={soundboard.selfLastPlayAt} onPlay={soundboard.onPlay} />
  const moreNode = <MorePopover key="more" fx={state.settings.fx} onFx={(next) => dispatch({ type: 'setFx', fx: next })} shortcutsOpen={shortcutsOpen} onShortcutsOpen={setShortcutsOpen} />
  const leaveNode = (
    <LeaveMenu
      key="leave"
      canEndForAll={selfRole === 'Host'}
      stopsRecording={recordingOn && othersInRoom === 0 && !inRoom}
      onReturnMain={canReturnMain ? () => dispatch({ type: 'breakoutLeave', id: SELF_ID, now: performance.now() }) : undefined}
      onLeave={() => dispatch({ type: 'leave', phase: 'left' })}
      onEnd={() => dispatch({ type: 'leave', phase: 'ended' })}
    />
  )
  const onShare = () => dispatch(state.sharerId === SELF_ID ? { type: 'stopShare' } : { type: 'startShare', id: SELF_ID })

  /** Everything that is not on the phone's control bar */
  const ICON = { size: 24, strokeWidth: 1.75, 'aria-hidden': true } as const
  const moreActions: MoreAction[] = [
    { id: 'hand', label: self.hand !== null ? 'Turunkan tangan' : 'Angkat tangan', icon: <Hand {...ICON} />, pressed: self.hand !== null, onSelect: () => dispatch({ type: 'toggleHand', id: SELF_ID }) },
    { id: 'highfive', label: 'High five', icon: <Handshake {...ICON} />, pressed: highFive.active, unavailable: highFive.disabledReason, onSelect: highFive.onHighFive },
    { id: 'sound', label: 'Soundboard', icon: <AudioLines {...ICON} />, unavailable: soundboard.disabledReason, onSelect: () => dispatch({ type: 'toggleDock', key: 'soundboard' }) },
    { id: 'share', label: state.sharerId === SELF_ID ? 'Berhenti berbagi' : 'Bagikan layar', icon: <MonitorUp {...ICON} />, pressed: state.sharerId === SELF_ID, unavailable: shareDisabledReason, onSelect: onShare },
    ...(annotation.enabled ? [{ id: 'annotate', label: annotation.annotating ? 'Selesai coret' : 'Coret layar', icon: <PenLine {...ICON} />, pressed: annotation.annotating, onSelect: annotation.toggleAnnotating }] : []),
    { id: 'layout', label: 'Tampilan', icon: <LayoutGrid {...ICON} />, onSelect: () => setLayoutOpen(true) },
    ...(showRuang ? [{ id: 'ruang', label: 'Ruang diskusi', icon: <DoorOpen {...ICON} />, badge: ruangBadge, onSelect: () => dispatch({ type: 'openPanel', panel: 'ruang' }) }] : []),
    { id: 'peserta', label: 'Peserta', icon: <Users {...ICON} />, badge: state.participants.length, onSelect: () => dispatch({ type: 'openPanel', panel: 'peserta' }) },
    { id: 'polling', label: 'Polling', icon: <ChartColumn {...ICON} />, badge: polls.pendingBadge, onSelect: () => dispatch({ type: 'openPanel', panel: 'polling' }) },
    { id: 'invite', label: 'Undang', icon: <UserPlus {...ICON} />, onSelect: () => setInviteOpen(true) },
    ...(canManage ? [{ id: 'host', label: 'Alat host', icon: <ShieldCheck {...ICON} />, badge: state.host.waiting.length, onSelect: () => dispatch({ type: 'openPanel', panel: 'host' }) }] : []),
    { id: 'mic', label: 'Atur mikrofon', icon: <Mic {...ICON} />, onSelect: () => dispatch({ type: 'toggleDock', key: 'mic' }) },
    { id: 'camera', label: 'Atur kamera', icon: <Video {...ICON} />, onSelect: () => dispatch({ type: 'toggleDock', key: 'camera' }) },
  ]

  return (
    <AnnotationProvider value={annotation}>
    <div className={styles.room} data-motion={reduced ? 'reduced' : 'full'} data-fx={fx} data-sharing={sharing} style={style}>
      <Ambient />
      <RoomWash state={all} dispatch={dispatch} />
      <TileGrid
        participants={state.participants}
        offers={state.highFive.offers}
        sharerId={state.sharerId}
        gridPage={paging.page}
        soundPlayers={soundboard.players}
        cameraQuality={state.settings.cameraQuality}
        layoutSettings={layoutSettings}
        dispatch={dispatch}
        phone={phone}
        onGridPage={paging.setPage}
        speakingElsewhere={paging.speakingElsewhere}
      />
      <TopBar
        recording={state.host.recording}
        locked={state.host.locked}
        people={compact ? { count: state.participants.length, active: state.panel === 'peserta', onClick: () => dispatch({ type: 'togglePanel', panel: 'peserta' }) } : undefined}
        leading={!phone && paging.pages > 1 && !sharing && layoutSettings.mode === 'gallery' ? <GridPager page={paging.page} pages={paging.pages} speakingElsewhere={paging.speakingElsewhere} onPage={paging.setPage} /> : null}
        menu={
          compact ? undefined : (
          <LayoutMenu
            settings={layoutSettings}
            pinnedName={state.participants.find((p) => p.id === layoutSettings.pinnedId)?.name ?? null}
            sharing={sharing}
            open={layoutOpen}
            onToggle={toggleLayout}
            onClose={closeLayout}
            onMode={(mode) => dispatch({ type: 'setLayoutMode', mode })}
            onHideNoVideo={(on) => dispatch({ type: 'setHideNoVideo', on })}
            onUnpin={() => dispatch({ type: 'pinParticipant', id: null })}
          />
          )
        }
      />
      <AnnouncementBanner announcement={state.host.announcement} onDismiss={dismissAnnouncement} />
      <ClaimHostBanner
        visible={!state.participants.some((p) => p.role === 'Host')}
        selfRole={selfRole}
        hostKey={state.host.hostKey}
        stacked={state.host.announcement !== null}
        onClaim={(key) => dispatch({ type: 'claimHost', id: SELF_ID, key, now: performance.now() })}
      />
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
        <QualitySuggestion weakConnection={self.connection !== 'good'} camOn={self.camOn} quality={state.settings.cameraQuality} onLower={() => dispatch({ type: 'setCameraQuality', quality: 'low' })} />
        <NoticeStack notices={state.notices} />
        <SoundChips plays={soundboard.plays} participants={state.participants} />
        <BreakoutPrompts state={all} now={breakoutNow} dispatch={dispatch} />
        <RoomStrip state={all} now={breakoutNow} dispatch={dispatch} />
        <GuestRequestToast
          guests={state.host.waiting}
          visible={canManage && state.panel !== 'host' && state.panel !== 'peserta'}
          onAdmit={(id) => dispatch({ type: 'guestDecide', id, admit: true, now: performance.now() })}
          onAdmitAll={() => dispatch({ type: 'guestAdmitAll', now: performance.now() })}
          onOpen={() => dispatch({ type: 'openPanel', panel: 'host' })}
        />
      </div>
      <ChatBubbles messages={state.chat.messages} people={[...state.participants, ...state.bench]} chatOpen={state.panel === 'chat'} onOpenChat={() => dispatch({ type: 'openPanel', panel: 'chat' })} />
      <InfoPill inviteOpen={inviteOpen} locked={state.host.locked} onInviteToggle={toggleInvite} onInviteClose={closeInvite} phone={compact} />
      <AnimatePresence>
        {state.panel && <SidePanel key="panel" panel={state.panel} state={state} all={all} now={breakoutNow} showRuang={showRuang} inRoom={inRoom} onSetup={() => setSetupOpen(true)} selfRole={selfRole} dispatch={dispatch} onInvite={() => setInviteOpen(true)} onClose={() => dispatch({ type: 'openPanel', panel: null })} />}
      </AnimatePresence>
      {!compact && (
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
        onShare={onShare}
        shareActive={state.sharerId === SELF_ID}
        shareDisabledReason={shareDisabledReason}
        highFiveActive={highFive.active}
        highFiveDisabledReason={highFive.disabledReason}
        soundboardDisabledReason={soundboard.disabledReason}
        mic={micNode}
        camera={cameraNode}
        soundboard={soundboardNode}
        more={moreNode}
        leave={leaveNode}
      />
      )}
      {!compact && (
      <PanelPill
        active={state.panel}
        participantCount={state.participants.length}
        unreadChat={unreadChatCount(state)}
        pendingPoll={polls.pendingBadge}
        showHost={canManage}
        showRuang={showRuang}
        ruangBadge={ruangBadge}
        hostBadge={state.host.waiting.length}
        onSelect={(panel) => dispatch({ type: 'togglePanel', panel })}
      />
      )}
      {compact && (
        <>
          <MobileDock
            self={self}
            toggles={state.toggles}
            unreadChat={unreadChatCount(state)}
            onToggleMic={() => dispatch({ type: 'toggleMic', id: SELF_ID })}
            onToggleCam={() => dispatch({ type: 'toggleCam', id: SELF_ID })}
            onToggle={(key) => dispatch({ type: 'toggleDock', key })}
            onClose={onClose}
            onReact={onReact}
            onHighFive={highFive.onHighFive}
            onChat={() => dispatch({ type: 'togglePanel', panel: 'chat' })}
            actions={moreActions}
            settings={moreNode}
            soundboard={soundboardNode}
            mic={micNode}
            camera={cameraNode}
            leave={leaveNode}
          />
          {layoutOpen && (
            <Sheet title="Tampilan layar" onClose={closeLayout}>
              <LayoutOptions
                settings={layoutSettings}
                pinnedName={state.participants.find((p) => p.id === layoutSettings.pinnedId)?.name ?? null}
                sharing={sharing}
                onMode={(mode) => dispatch({ type: 'setLayoutMode', mode })}
                onHideNoVideo={(on) => dispatch({ type: 'setHideNoVideo', on })}
                onUnpin={() => dispatch({ type: 'pinParticipant', id: null })}
                showTitle={false}
              />
            </Sheet>
          )}
          {inviteOpen && (
            <Sheet title="Undang" onClose={closeInvite}>
              <Flat>
                <InvitePopover title={MEETING_TITLE} url={buildInviteUrl(MEETING_CODE)} locked={state.host.locked} />
              </Flat>
            </Sheet>
          )}
        </>
      )}
      {setupOpen && canManage && <BreakoutSetup state={all} now={breakoutNow} dispatch={dispatch} onClose={() => setSetupOpen(false)} />}
      {needsConsent && <RecordingConsent onAgree={() => dispatch({ type: 'recordingConsent' })} onLeave={() => dispatch({ type: 'leave', phase: 'left' })} />}
    </div>
    </AnnotationProvider>
  )
}
