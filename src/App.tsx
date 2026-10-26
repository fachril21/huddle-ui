import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { installAudioUnlock, setGroupMuted, setOutputDevice } from './audio/audioEngine'
import { preloadEmoji } from './emoji/AnimatedEmoji'
import { EMOJI } from './emoji/registry'
import type { EmojiName } from './emoji/registry'
import { DemoDirector } from './demo/DemoDirector'
import { DemoToggle } from './demo/DemoToggle'
import { useScenarioPlayer } from './demo/useScenarioPlayer'
import { motion } from 'motion/react'
import { CurrentUserProvider } from './auth/CurrentUser'
import { inviteCodeFromPath, inviteTarget } from './auth/inviteEntry'
import { LoginPage } from './auth/LoginPage'
import { clearSession, loadSession, saveSession } from './auth/session'
import type { Session } from './auth/session'
import { scopedState } from './breakout/rooms'
import { Dashboard } from './dashboard/Dashboard'
import type { DashboardView } from './dashboard/Rail'
import { EndedPage } from './ended/EndedPage'
import { closingRecordingNote } from './ended/endedCopy'
import type { JoinTarget } from './dashboard/types'
import { useMeetings } from './dashboard/useMeetings'
import { PreJoin } from './prejoin/PreJoin'
import type { JoinChoice } from './prejoin/PreJoin'
import { loadCameraQuality, saveCameraQuality } from './room/cameraQuality'
import { useRecordings } from './recordings/recordingStore'
import { useRecordingSync } from './recordings/useRecordingSync'
import { loadPreferences } from './settings/preferences'
import { useRoomSounds } from './room/hooks/useRoomSounds'
import { MotionProvider } from './room/MotionContext'
import { Room } from './room/Room'
import styles from './room/Room.module.css'
import { initialRoomState, roomReducer } from './state/roomReducer'
import { SELF_ID } from './state/types'
import { VoiceEngine } from './voice/engine'
import type { VoiceInput } from './voice/engine'
import { VoiceProvider } from './voice/VoiceContext'
import { admissionReducer } from './waiting/admission'
import { WaitingRoom } from './waiting/WaitingRoom'
import type { RoomAction } from './state/actions'

/** The tier chosen in Pengaturan wins. Otherwise a phone starts on the lighter one (smaller blur, still mesh): it spares the battery and the GPU. */
function defaultFx() {
  return loadPreferences().fx ?? (window.matchMedia('(max-width: 767px)').matches ? 'lite' : initialRoomState.settings.fx)
}

interface AuthedAppProps {
  /** Null for a guest who arrived by a meeting link */
  session: Session | null
  /** The meeting code from the link, opened straight into its lobby */
  invite: string | null
  onSignOut: () => void
  /** A guest finished and asked for the dashboard, which needs a sign-in */
  onGuestDone: () => void
}

function AuthedApp({ session, invite, onSignOut, onGuestDone }: AuthedAppProps) {
  const [state, dispatch] = useReducer(roomReducer, initialRoomState, (initial) => ({ ...initial, settings: { ...initial.settings, cameraQuality: loadCameraQuality(), fx: defaultFx() } }))
  const [engine] = useState(() => new VoiceEngine(SELF_ID))
  const [demoOpen, setDemoOpen] = useState(false)
  // the dashboard shows while no room is chosen; the lobby shows once one is; the room once Masuk is pressed
  const { meetings, dispatch: meetingDispatch } = useMeetings(session?.name)
  const [target, setTarget] = useState<JoinTarget | null>(() => (invite ? inviteTarget(invite, meetings, session !== null) : null))
  const [joined, setJoined] = useState<JoinChoice | null>(null)
  const [joinedAt, setJoinedAt] = useState(0)
  // which dashboard page opens next: the end page can point straight at Rekaman
  const [homeView, setHomeView] = useState<DashboardView>('home')
  // a guest of a meeting with a waiting room sits here, between the lobby and the room, until the host answers
  const [asking, setAsking] = useState<JoinChoice | null>(null)
  const [admission, admissionDispatch] = useReducer(admissionReducer, null)
  const player = useScenarioPlayer(dispatch)
  const recordings = useRecordings()
  useRecordingSync(state, target, joined !== null, recordings)

  useEffect(() => {
    setGroupMuted('notify', !loadPreferences().notifySounds)
    installAudioUnlock()
    preloadEmoji(Object.keys(EMOJI) as EmojiName[])
  }, [])

  // while Ruang diskusi are live, the room, the voices and the sounds belong to the room the user is in
  const view = useMemo(() => scopedState(state), [state])
  useRoomSounds(view)
  useEffect(() => saveCameraQuality(state.settings.cameraQuality), [state.settings.cameraQuality])
  useEffect(() => setOutputDevice(state.settings.devices.speakerId), [state.settings.devices.speakerId])

  useEffect(() => {
    engine.start()
    return () => engine.stop()
  }, [engine])

  // Feed Demo Director state to the engine. Mic state comes from participants, voice from the director.
  useEffect(() => {
    const inputs: Record<string, VoiceInput> = {}
    for (const p of view.participants) inputs[p.id] = { ...state.voice[p.id], micOn: p.micOn }
    // people outside the room (or in another Ruang diskusi) stay silent
    for (const p of view.bench) inputs[p.id] = { ...state.voice[p.id], talking: false, micOn: false }
    engine.setInputs(inputs)
  }, [engine, view.participants, view.bench, state.voice])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        setDemoOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const join = (choice: JoinChoice) => {
    dispatch({ type: 'joinRoom', name: choice.name, micOn: choice.micOn, camOn: choice.camOn, quality: choice.cameraQuality, devices: choice.devices, background: choice.background })
    setAsking(null)
    admissionDispatch({ type: 'cancel' })
    setJoinedAt(performance.now())
    setJoined(choice)
  }

  const ask = (choice: JoinChoice, hostPresent: boolean) => {
    setAsking(choice)
    admissionDispatch({ type: 'request', now: Date.now(), hostPresent })
  }
  const stopAsking = () => {
    setAsking(null)
    admissionDispatch({ type: 'cancel' })
  }
  const tickAdmission = useCallback((now: number) => admissionDispatch({ type: 'tick', now }), [])

  // "Mulai ulang demo" on the closing screen sends people back to the dashboard; the Demo Director's own reset stays in the room
  const roomDispatch = (action: RoomAction) => {
    if (action.type === 'reset') {
      setJoined(null)
      setTarget(null)
    }
    dispatch(action)
  }

  // after the room: back to a fresh state, then either the lobby of the same meeting or the dashboard
  const leaveEndPage = (next: 'lobby' | DashboardView) => {
    dispatch({ type: 'reset' })
    setJoined(null)
    if (next === 'lobby') return
    setTarget(null)
    setHomeView(next)
  }

  const stage = joined ? (state.phase === 'live' ? 'room' : 'ended') : asking && admission ? 'waiting' : target ? 'lobby' : 'dashboard'

  // a guest has no dashboard: leaving the meeting flow hands them to the sign-in page
  const isGuest = session === null
  useEffect(() => {
    if (isGuest && stage === 'dashboard') onGuestDone()
  }, [isGuest, stage, onGuestDone])

  return (
    <MotionProvider fx={state.settings.fx} simulateReduced={state.settings.simulateReduced}>
    <CurrentUserProvider user={session && { name: session.name, email: session.email, signOut: onSignOut }}>
    <VoiceProvider engine={engine}>
      <motion.div key={stage} className={styles.stage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}>
        {stage === 'room' && <Room state={view} all={state} dispatch={roomDispatch} />}
        {stage === 'ended' && target && state.phase !== 'live' && (
          <EndedPage
            meeting={target}
            phase={state.phase}
            joinedAt={joinedAt}
            othersInRoom={state.participants.filter((p) => p.id !== SELF_ID).length}
            selfIsHost={state.participants.find((p) => p.id === SELF_ID)?.role === 'Host'}
            recordingNote={closingRecordingNote(state.phase, state.host.recording !== 'off', state.participants.filter((p) => p.id !== SELF_ID).length)}
            onRejoin={() => leaveEndPage('lobby')}
            onHome={() => leaveEndPage('home')}
            onRecordings={() => leaveEndPage('recordings')}
          />
        )}
        {stage === 'lobby' && target && <PreJoin meeting={target} onJoin={target.needsApproval ? (choice) => ask(choice, target.hostPresent ?? true) : join} onBack={() => setTarget(null)} />}
        {stage === 'waiting' && target && asking && admission && (
          <WaitingRoom
            meeting={target}
            choice={asking}
            admission={admission}
            onEnter={join}
            onTick={tickAdmission}
            onAskAgain={() => ask(asking, true)}
            onCancel={stopAsking}
            onHome={() => {
              stopAsking()
              setTarget(null)
            }}
          />
        )}
        {stage === 'dashboard' && session && <Dashboard meetings={meetings} dispatch={meetingDispatch} initialView={homeView} onEnter={(t) => { setHomeView('home'); setTarget(t) }} recordings={recordings} settings={state.settings} roomDispatch={dispatch} />}
      </motion.div>
      <DemoToggle open={demoOpen} onClick={() => setDemoOpen((o) => !o)} />
      <DemoDirector state={state} dispatch={dispatch} player={player} admission={admission} onAdmission={admissionDispatch} open={demoOpen} onClose={() => setDemoOpen(false)} />
    </VoiceProvider>
    </CurrentUserProvider>
    </MotionProvider>
  )
}

/** The front door. A meeting link goes straight to its lobby for anyone; the dashboard needs a company sign-in. */
export function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [invite, setInvite] = useState<string | null>(() => inviteCodeFromPath(window.location.pathname))

  const leaveInvite = useCallback(() => {
    window.history.replaceState(null, '', '/')
    setInvite(null)
  }, [])

  const signIn = (next: Session) => {
    saveSession(next)
    setSession(next)
  }

  const signOut = () => {
    clearSession()
    setSession(null)
    leaveInvite()
  }

  if (!session && !invite) {
    return (
      <MotionProvider fx={defaultFx()} simulateReduced={false}>
        <LoginPage onSignedIn={signIn} />
      </MotionProvider>
    )
  }

  return <AuthedApp key={session?.email ?? 'guest'} session={session} invite={invite} onSignOut={signOut} onGuestDone={leaveInvite} />
}
