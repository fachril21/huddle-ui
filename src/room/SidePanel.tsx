import { X } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import type { Dispatch } from 'react'
import { ChatPanel } from '../features/chat/ChatPanel'
import { HostPanel } from '../features/host/HostPanel'
import { ParticipantsPanel } from '../features/participants/ParticipantsPanel'
import { PollingPanel } from '../features/polls/PollingPanel'
import type { RoomAction } from '../state/roomReducer'
import { SELF_ID } from '../state/types'
import type { PanelName, Role, RoomState } from '../state/types'
import styles from './SidePanel.module.css'

interface SidePanelProps {
  panel: PanelName
  state: RoomState
  selfRole: Role
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
export function SidePanel({ panel, state, selfRole, dispatch, onClose }: SidePanelProps) {
  const canManage = selfRole === 'Host' || selfRole === 'Co-host'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      onClose()
      document.querySelector<HTMLElement>(`[data-panel-trigger="${panel}"]`)?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [panel, onClose])

  const now = () => performance.now()

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
        {panel !== 'host' ? (
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

      <div className={styles.body} data-panel={panel}>
        {panel === 'peserta' && (
          <ParticipantsPanel
            participants={state.participants}
            selfRole={selfRole}
            onMute={(id) => dispatch({ type: 'toggleMic', id })}
            onCoHost={(id) => dispatch({ type: 'setRole', id, role: 'Co-host' })}
            onMakeHost={(id) => dispatch({ type: 'makeHost', id })}
            onRemove={(id) => dispatch({ type: 'removeParticipant', id, now: now() })}
          />
        )}
        {panel === 'chat' && (
          <ChatPanel chat={state.chat} participants={state.participants} onSend={(text, toId) => dispatch({ type: 'chatSend', fromId: SELF_ID, toId, text, now: now() })} />
        )}
        {panel === 'polling' && (
          <PollingPanel
            polls={state.polls}
            participantCount={state.participants.length}
            selfId={SELF_ID}
            canManage={canManage}
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
                  startedAt: now(),
                  creatorId: SELF_ID,
                },
              })
            }
            onVote={(optionIds) => dispatch({ type: 'pollVote', voterId: SELF_ID, optionIds })}
            onClose={() => dispatch({ type: 'pollClose' })}
          />
        )}
        {panel === 'host' && canManage && (
          <HostPanel
            host={state.host}
            soundboardAllowed={state.soundboard.allowed}
            onDecide={(id, admit) => dispatch({ type: 'guestDecide', id, admit, now: now() })}
            onLock={(on) => dispatch({ type: 'hostLock', on, now: now() })}
            onRestrictShare={(on) => dispatch({ type: 'hostRestrictShare', on })}
            onSoundboard={(on) => dispatch({ type: 'sbAllow', on })}
            onMuteAll={() => dispatch({ type: 'muteAll', now: now() })}
            onAnnounce={(text) => dispatch({ type: 'announce', text })}
            onRecording={(s) => dispatch({ type: 'hostRecording', state: s })}
          />
        )}
      </div>
    </motion.aside>
  )
}
