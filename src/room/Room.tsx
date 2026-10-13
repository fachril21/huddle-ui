import type { Dispatch } from 'react'
import type { RoomAction } from '../state/roomReducer'
import { SELF_ID } from '../state/types'
import type { RoomState } from '../state/types'
import { Ambient } from './Ambient'
import { Dock } from './Dock'
import { InfoPill } from './InfoPill'
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
  const self = state.participants.find((p) => p.id === SELF_ID)
  if (!self) return null

  return (
    <div className={styles.room} data-motion={reducedMotion ? 'reduced' : 'full'}>
      <Ambient />
      <TileGrid participants={state.participants} />
      <TopBar />
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
