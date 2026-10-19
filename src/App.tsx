import { useEffect, useReducer, useState } from 'react'
import { installAudioUnlock, setGroupMuted, setOutputDevice } from './audio/audioEngine'
import { preloadEmoji } from './emoji/AnimatedEmoji'
import { EMOJI } from './emoji/registry'
import type { EmojiName } from './emoji/registry'
import { DemoDirector } from './demo/DemoDirector'
import { DemoToggle } from './demo/DemoToggle'
import { useScenarioPlayer } from './demo/useScenarioPlayer'
import { motion } from 'motion/react'
import { Dashboard } from './dashboard/Dashboard'
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
import type { RoomAction } from './state/actions'

/** The tier chosen in Pengaturan wins. Otherwise a phone starts on the lighter one (smaller blur, still mesh): it spares the battery and the GPU. */
function defaultFx() {
  return loadPreferences().fx ?? (window.matchMedia('(max-width: 767px)').matches ? 'lite' : initialRoomState.settings.fx)
}

export function App() {
  const [state, dispatch] = useReducer(roomReducer, initialRoomState, (initial) => ({ ...initial, settings: { ...initial.settings, cameraQuality: loadCameraQuality(), fx: defaultFx() } }))
  const [engine] = useState(() => new VoiceEngine(SELF_ID))
  const [demoOpen, setDemoOpen] = useState(false)
  // the dashboard shows while no room is chosen; the lobby shows once one is; the room once Masuk is pressed
  const [target, setTarget] = useState<JoinTarget | null>(null)
  const [joined, setJoined] = useState<JoinChoice | null>(null)
  const { meetings, dispatch: meetingDispatch } = useMeetings()
  const player = useScenarioPlayer(dispatch)
  const recordings = useRecordings()
  useRecordingSync(state, target, joined !== null, recordings)

  useEffect(() => {
    setGroupMuted('notify', !loadPreferences().notifySounds)
    installAudioUnlock()
    preloadEmoji(Object.keys(EMOJI) as EmojiName[])
  }, [])

  useRoomSounds(state)
  useEffect(() => saveCameraQuality(state.settings.cameraQuality), [state.settings.cameraQuality])
  useEffect(() => setOutputDevice(state.settings.devices.speakerId), [state.settings.devices.speakerId])

  useEffect(() => {
    engine.start()
    return () => engine.stop()
  }, [engine])

  // Feed Demo Director state to the engine. Mic state comes from participants, voice from the director.
  useEffect(() => {
    const inputs: Record<string, VoiceInput> = {}
    for (const p of state.participants) inputs[p.id] = { ...state.voice[p.id], micOn: p.micOn }
    // people outside the room stay silent
    for (const p of state.bench) inputs[p.id] = { ...state.voice[p.id], talking: false, micOn: false }
    engine.setInputs(inputs)
  }, [engine, state.participants, state.bench, state.voice])

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
    dispatch({ type: 'joinRoom', name: choice.name, micOn: choice.micOn, camOn: choice.camOn, quality: choice.cameraQuality, devices: choice.devices })
    setJoined(choice)
  }

  // "Mulai ulang demo" on the closing screen sends people back to the dashboard; the Demo Director's own reset stays in the room
  const roomDispatch = (action: RoomAction) => {
    if (action.type === 'reset') {
      setJoined(null)
      setTarget(null)
    }
    dispatch(action)
  }

  const stage = joined ? 'room' : target ? 'lobby' : 'dashboard'

  return (
    <MotionProvider fx={state.settings.fx} simulateReduced={state.settings.simulateReduced}>
    <VoiceProvider engine={engine}>
      <motion.div key={stage} className={styles.stage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}>
        {stage === 'room' && <Room state={state} dispatch={roomDispatch} />}
        {stage === 'lobby' && target && <PreJoin meeting={target} onJoin={join} onBack={() => setTarget(null)} />}
        {stage === 'dashboard' && <Dashboard meetings={meetings} dispatch={meetingDispatch} onEnter={setTarget} recordings={recordings} settings={state.settings} roomDispatch={dispatch} />}
      </motion.div>
      <DemoToggle open={demoOpen} onClick={() => setDemoOpen((o) => !o)} />
      <DemoDirector state={state} dispatch={dispatch} player={player} open={demoOpen} onClose={() => setDemoOpen(false)} />
    </VoiceProvider>
    </MotionProvider>
  )
}
