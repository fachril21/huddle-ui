import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { Dispatch } from 'react'
import type { RoomAction } from '../state/roomReducer'
import type { RoomState } from '../state/types'
import { Group, Toggle } from './controls'
import styles from './DemoDirector.module.css'
import { BreakoutSection } from './sections/BreakoutSection'
import { EventsSection } from './sections/EventsSection'
import { ParticipantsSection } from './sections/ParticipantsSection'
import { ScenarioSection } from './sections/ScenarioSection'
import { ViewSection } from './sections/ViewSection'
import type { ScenarioPlayer } from './useScenarioPlayer'
import { WaitingSection } from './sections/WaitingSection'
import type { Admission, AdmissionAction } from '../waiting/admission'

interface DemoDirectorProps {
  state: RoomState
  dispatch: Dispatch<RoomAction>
  player: ScenarioPlayer
  admission: Admission | null
  onAdmission: Dispatch<AdmissionAction>
  open: boolean
  onClose: () => void
}

const PRESETS = [
  { preset: 'silence', label: 'Semua hening' },
  { preset: 'solo', label: 'Satu pembicara' },
  { preset: 'crowd', label: 'Ramai (3 bicara)' },
] as const

/** Prototype control panel. Deliberately NOT styled like product UI: dashed outline, mono type. */
export function DemoDirector({ state, dispatch, player, admission, onAdmission, open, onClose }: DemoDirectorProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className={styles.panel}
          aria-label="Demo Director"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8, transition: { duration: 0.15 } }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        >
          <header className={styles.head}>
            <span>DEMO DIRECTOR</span>
            <span className={styles.hint}>Shift+D</span>
            <button type="button" className={styles.close} aria-label="Tutup Demo Director" onClick={onClose}>
              <X size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </header>

          <Group title="Skenario" defaultOpen>
            <ScenarioSection player={player} />
          </Group>

          <Group title="Tampilan">
            <ViewSection state={state} dispatch={dispatch} />
          </Group>

          <Group title="Aksi massal">
            <div className={styles.presets}>
              {PRESETS.map(({ preset, label }) => (
                <Toggle key={preset} label={label} onClick={() => dispatch({ type: 'applyVoicePreset', preset })} />
              ))}
            </div>
          </Group>

          <Group title="Kejadian cepat">
            <EventsSection state={state} dispatch={dispatch} />
          </Group>

          <Group title="Ruang diskusi" defaultOpen={state.breakout.phase === 'open' || state.breakout.phase === 'closing'}>
            <BreakoutSection state={state} dispatch={dispatch} />
          </Group>

          <Group title="Ruang tunggu (sisi tamu)" defaultOpen={admission !== null}>
            <WaitingSection admission={admission} onAdmission={onAdmission} />
          </Group>

          <Group title="Peserta" defaultOpen>
            <ParticipantsSection state={state} dispatch={dispatch} />
          </Group>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
