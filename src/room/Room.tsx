import { useEffect } from 'react'
import type { CSSProperties, Dispatch } from 'react'
import type { RoomAction } from '../state/roomReducer'
import { SELF_ID } from '../state/types'
import type { RoomState } from '../state/types'
import { useVoiceEngine, useVoiceSnapshot } from '../voice/VoiceContext'
import { Ambient } from './Ambient'
import { Dock } from './Dock'
import { InfoPill } from './InfoPill'
import { MutedBanner } from './MutedBanner'
import { PanelPill } from './PanelPill'
import { TileGrid } from './TileGrid'
import { TopBar } from './TopBar'
import { useReducedMotion } from './useReducedMotion'
import styles from './Room.module.css'

/** Mock unread chat count: the private message from Dewi mentioning @Anda (PRD 11.4). */
const MOCK_UNREAD_CHAT = 1

interface RoomProps {
  state: RoomState
  dispatch: Dispatch<RoomAction>
}

export function Room({ state, dispatch }: RoomProps) {
  const reducedMotion = useReducedMotion()
  const engine = useVoiceEngine()
  const voice = useVoiceSnapshot()
  const self = state.participants.find((p) => p.id === SELF_ID)

  useEffect(() => engine.setReducedMotion(reducedMotion), [engine, reducedMotion])

  if (!self) return null

  const style = { '--crosstalk': voice.crosstalk ? 1 : 0 } as CSSProperties

  return (
    <div className={styles.room} data-motion={reducedMotion ? 'reduced' : 'full'} style={style}>
      <Ambient />
      <TileGrid participants={state.participants} />
      <TopBar />
      <MutedBanner visible={voice.mutedSpeaking && !self.micOn} onUnmute={() => dispatch({ type: 'setMic', id: SELF_ID, on: true })} />
      <InfoPill />
      <Dock
        self={self}
        toggles={state.toggles}
        onToggleMic={() => dispatch({ type: 'toggleMic', id: SELF_ID })}
        onToggleCam={() => dispatch({ type: 'toggleCam', id: SELF_ID })}
        onToggle={(key) => dispatch({ type: 'toggleDock', key })}
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
