import type { Dispatch } from 'react'
import type { RoomAction } from '../../state/roomReducer'
import { SELF_ID } from '../../state/types'
import type { FxTier, Role, RoomState } from '../../state/types'
import { Toggle } from '../controls'
import styles from '../DemoDirector.module.css'

const COUNTS = [4, 8, 12] as const
const FX: readonly { fx: FxTier; label: string }[] = [
  { fx: 'full', label: 'Penuh' },
  { fx: 'lite', label: 'Hemat' },
  { fx: 'off', label: 'Mati' },
]
const ROLES: readonly Role[] = ['Host', 'Co-host', 'Peserta', 'Tamu']

/** Number of people, effects tier, simulated reduced motion, and the role switcher (PRD 9). */
export function ViewSection({ state, dispatch }: { state: RoomState; dispatch: Dispatch<RoomAction> }) {
  const selfRole = state.participants.find((p) => p.id === SELF_ID)?.role
  return (
    <div className={styles.stack}>
      <Row label="Peserta">
        {COUNTS.map((n) => (
          <Toggle key={n} label={String(n)} on={state.participants.length === n} onClick={() => dispatch({ type: 'setCount', count: n })} />
        ))}
      </Row>
      <Row label="Efek visual">
        {FX.map((t) => (
          <Toggle key={t.fx} label={t.label} on={state.settings.fx === t.fx} onClick={() => dispatch({ type: 'setFx', fx: t.fx })} />
        ))}
      </Row>
      <Row label="Role Anda">
        {ROLES.map((r) => (
          <Toggle key={r} label={r} on={selfRole === r} onClick={() => dispatch({ type: 'setRole', id: SELF_ID, role: r })} />
        ))}
      </Row>
      <Row label="Reduced motion">
        <Toggle label="Simulasikan" on={state.settings.simulateReduced} onClick={() => dispatch({ type: 'setSimulateReduced', on: !state.settings.simulateReduced })} />
      </Row>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.row2}>
      <span>{label}</span>
      <div className={styles.toggles}>{children}</div>
    </div>
  )
}
