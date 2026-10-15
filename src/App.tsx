import { useEffect, useReducer, useState } from 'react'
import { installAudioUnlock } from './audio/audioEngine'
import { preloadEmoji } from './emoji/AnimatedEmoji'
import { EMOJI } from './emoji/registry'
import type { EmojiName } from './emoji/registry'
import { DemoDirector } from './demo/DemoDirector'
import { DemoToggle } from './demo/DemoToggle'
import { useScenarioPlayer } from './demo/useScenarioPlayer'
import { motion } from 'motion/react'
import { PreJoin } from './prejoin/PreJoin'
import type { JoinChoice } from './prejoin/PreJoin'
import { loadCameraQuality, saveCameraQuality } from './room/cameraQuality'
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

export function App() {
  const [state, dispatch] = useReducer(roomReducer, initialRoomState, (initial) => ({ ...initial, settings: { ...initial.settings, cameraQuality: loadCameraQuality() } }))
  const [engine] = useState(() => new VoiceEngine(SELF_ID))
  const [demoOpen, setDemoOpen] = useState(false)
  // null while in the lobby; set once the user presses Masuk
  const [joined, setJoined] = useState<JoinChoice | null>(null)
  const player = useScenarioPlayer(dispatch)

  useEffect(() => {
    installAudioUnlock()
    preloadEmoji(Object.keys(EMOJI) as EmojiName[])
  }, [])

  useRoomSounds(state)
  useEffect(() => saveCameraQuality(state.settings.cameraQuality), [state.settings.cameraQuality])

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
    dispatch({ type: 'joinRoom', name: choice.name, micOn: choice.micOn, camOn: choice.camOn, quality: choice.cameraQuality })
    setJoined(choice)
  }

  // "Mulai ulang demo" on the closing screen sends people back to the lobby; the Demo Director's own reset stays in the room
  const roomDispatch = (action: RoomAction) => {
    if (action.type === 'reset') setJoined(null)
    dispatch(action)
  }

  return (
    <MotionProvider fx={state.settings.fx} simulateReduced={state.settings.simulateReduced}>
    <VoiceProvider engine={engine}>
      <motion.div key={joined ? 'room' : 'lobby'} className={styles.stage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}>
        {joined ? <Room state={state} dispatch={roomDispatch} /> : <PreJoin onJoin={join} />}
      </motion.div>
      <DemoToggle open={demoOpen} onClick={() => setDemoOpen((o) => !o)} />
      <DemoDirector state={state} dispatch={dispatch} player={player} open={demoOpen} onClose={() => setDemoOpen(false)} />
      <div className={styles.notice} role="alert">
        <div>
          <h1>Layar terlalu sempit</h1>
          <p>Prototype ini dioptimalkan untuk layar desktop (minimal 1100 px).</p>
        </div>
      </div>
    </VoiceProvider>
    </MotionProvider>
  )
}
