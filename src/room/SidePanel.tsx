import { Hand, MicOff, VideoOff, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import type { Dispatch } from 'react'
import { PollingPanel } from '../features/polls/PollingPanel'
import type { RoomAction } from '../state/roomReducer'
import { SELF_ID } from '../state/types'
import type { PanelName, RoomState } from '../state/types'
import styles from './SidePanel.module.css'

interface SidePanelProps {
  panel: PanelName
  state: RoomState
  dispatch: Dispatch<RoomAction>
  onClose: () => void
}

const TABS: readonly { name: PanelName; label: string }[] = [
  { name: 'peserta', label: 'Peserta' },
  { name: 'chat', label: 'Chat' },
  { name: 'polling', label: 'Polling' },
]

const PANEL_TITLES: Record<PanelName, string> = { peserta: 'Peserta', chat: 'Chat', polling: 'Polling', host: 'Alat host' }

/** Floating glass-2 card on the right (Design.md 15.2). Esc closes it and returns focus to its trigger. */
export function SidePanel({ panel, state, dispatch, onClose }: SidePanelProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      onClose()
      document.querySelector<HTMLElement>(`[data-panel-trigger="${panel}"]`)?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [panel, onClose])

  const isTabbed = panel !== 'host'

  return (
    <motion.aside
      className={`glass-2 ${styles.panel}`}
      aria-label={PANEL_TITLES[panel]}
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.18 } }}
      transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <header className={styles.head}>
        {isTabbed ? (
          <div className={styles.tabs} role="tablist" aria-label="Panel samping">
            {TABS.map((t) => (
              <button key={t.name} type="button" role="tab" aria-selected={panel === t.name} onClick={() => dispatch({ type: 'openPanel', panel: t.name })}>
                {t.label}
              </button>
            ))}
          </div>
        ) : (
          <h2>{PANEL_TITLES[panel]}</h2>
        )}
        <button type="button" className={styles.close} aria-label="Tutup panel" onClick={onClose}>
          <X size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </header>

      <div className={styles.body}>
        {panel === 'peserta' && <ParticipantsTab state={state} />}
        {panel === 'chat' && <p className={styles.placeholder}>Chat belum tersedia di tahap ini.</p>}
        {panel === 'polling' && (
          <PollingPanel
            polls={state.polls}
            participantCount={state.participants.length}
            selfId={SELF_ID}
            canManage
            onStart={(draft) =>
              dispatch({
                type: 'pollStart',
                poll: {
                  question: draft.question,
                  options: draft.options.map((text, i) => ({ id: `o${i + 1}`, text })),
                  multiple: draft.multiple,
                  anonymous: draft.anonymous,
                  liveResults: draft.liveResults,
                  autoCloseS: draft.autoCloseS,
                  startedAt: performance.now(),
                  creatorId: SELF_ID,
                },
              })
            }
            onVote={(optionIds) => dispatch({ type: 'pollVote', voterId: SELF_ID, optionIds })}
            onClose={() => dispatch({ type: 'pollClose' })}
          />
        )}
        {panel === 'host' && <HostTools state={state} dispatch={dispatch} />}
      </div>
    </motion.aside>
  )
}

function ParticipantsTab({ state }: { state: RoomState }) {
  const raised = state.participants.filter((p) => p.hand !== null).sort((a, b) => (a.hand ?? 0) - (b.hand ?? 0))
  return (
    <div className={styles.stack}>
      {raised.length > 0 && (
        <section aria-label="Antrean tangan terangkat">
          <h3 className={styles.sub}>Tangan terangkat</h3>
          <ol className={styles.queue}>
            {raised.map((p) => (
              <li key={p.id}>
                <span className={styles.seq}>{p.hand}</span>
                {p.name}
                <Hand size={14} strokeWidth={1.75} aria-hidden="true" className={styles.handIcon} />
              </li>
            ))}
          </ol>
        </section>
      )}
      <section aria-label="Daftar peserta">
        <h3 className={styles.sub}>Di meeting ({state.participants.length})</h3>
        <ul className={styles.people}>
          {state.participants.map((p) => (
            <li key={p.id} data-palette={p.palette}>
              <i className={styles.dot} aria-hidden="true">{p.name.charAt(0)}</i>
              <span className={styles.name}>{p.name}</span>
              {(p.role === 'Host' || p.role === 'Co-host') && <span className={styles.role}>{p.role}</span>}
              {p.status !== 'none' && <span className={styles.away}>{p.status === 'afk' ? 'AFK' : 'BRB'}</span>}
              <span className={styles.flags}>
                {!p.micOn && <MicOff size={14} strokeWidth={1.75} aria-label="Mikrofon mati" role="img" />}
                {!p.camOn && <VideoOff size={14} strokeWidth={1.75} aria-label="Kamera mati" role="img" />}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function HostTools({ state, dispatch }: { state: RoomState; dispatch: Dispatch<RoomAction> }) {
  const allowed = state.soundboard.allowed
  return (
    <section aria-label="Moderasi">
      <h3 className={styles.sub}>Moderasi</h3>
      <button type="button" role="switch" aria-checked={allowed} className={styles.switch} onClick={() => dispatch({ type: 'sbAllow', on: !allowed })}>
        <span>Izinkan soundboard</span>
        <i aria-hidden="true" />
      </button>
    </section>
  )
}
