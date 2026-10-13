import { useEffect, useReducer, useState } from 'react'
import { DemoDirector } from './demo/DemoDirector'
import { DemoToggle } from './demo/DemoToggle'
import { Room } from './room/Room'
import styles from './room/Room.module.css'
import { initialRoomState, roomReducer } from './state/roomReducer'
import { SELF_ID } from './state/types'
import { VoiceEngine } from './voice/engine'
import type { VoiceInput } from './voice/engine'
import { VoiceProvider } from './voice/VoiceContext'

export function App() {
  const [state, dispatch] = useReducer(roomReducer, initialRoomState)
  const [engine] = useState(() => new VoiceEngine(SELF_ID))
  const [demoOpen, setDemoOpen] = useState(false)

  useEffect(() => {
    engine.start()
    return () => engine.stop()
  }, [engine])

  // Feed Demo Director state to the engine. Mic state comes from participants, voice from the director.
  useEffect(() => {
    const inputs: Record<string, VoiceInput> = {}
    for (const p of state.participants) inputs[p.id] = { ...state.voice[p.id], micOn: p.micOn }
    engine.setInputs(inputs)
  }, [engine, state.participants, state.voice])

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

  return (
    <VoiceProvider engine={engine}>
      <Room state={state} dispatch={dispatch} />
      <DemoToggle open={demoOpen} onClick={() => setDemoOpen((o) => !o)} />
      <DemoDirector state={state} dispatch={dispatch} open={demoOpen} onClose={() => setDemoOpen(false)} />
      <div className={styles.notice} role="alert">
        <div>
          <h1>Layar terlalu sempit</h1>
          <p>Prototype ini dioptimalkan untuk layar desktop (minimal 1100 px).</p>
        </div>
      </div>
    </VoiceProvider>
  )
}
