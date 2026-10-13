import { useReducer } from 'react'
import { Room } from './room/Room'
import styles from './room/Room.module.css'
import { initialRoomState, roomReducer } from './state/roomReducer'

export function App() {
  const [state, dispatch] = useReducer(roomReducer, initialRoomState)

  return (
    <>
      <Room state={state} dispatch={dispatch} />
      <div className={styles.notice} role="alert">
        <div>
          <h1>Layar terlalu sempit</h1>
          <p>Prototype ini dioptimalkan untuk layar desktop (minimal 1100 px).</p>
        </div>
      </div>
    </>
  )
}
