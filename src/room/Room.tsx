import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { CSSProperties, Dispatch } from 'react'
import type { RoomAction } from '../state/roomReducer'
import { SELF_ID } from '../state/types'
import type { DockToggle, ReactionName, RoomState } from '../state/types'
import { useVoiceEngine, useVoiceSnapshot } from '../voice/VoiceContext'
import { Ambient } from './Ambient'
import { Dock } from './Dock'
import { HighFiveStage } from './HighFiveStage'
import { HighFiveToasts } from './HighFiveToasts'
import { InfoPill } from './InfoPill'
import { MutedBanner } from './MutedBanner'
import { PanelPill } from './PanelPill'
import { ReactionLayer } from './ReactionLayer'
import { BURST_LIMIT, BURST_WINDOW_MS } from './reactions'
import { TileGrid } from './TileGrid'
import { TopBar } from './TopBar'
import { useReducedMotion } from './useReducedMotion'
import styles from './Room.module.css'

/** Mock unread chat count: the private message from Dewi mentioning @Anda (PRD 11.4). */
const MOCK_UNREAD_CHAT = 1
const REACTION_X_MIN = 24
const REACTION_X_MAX = 200

interface RoomProps {
  state: RoomState
  dispatch: Dispatch<RoomAction>
}

export function Room({ state, dispatch }: RoomProps) {
  const reducedMotion = useReducedMotion()
  const engine = useVoiceEngine()
  const voice = useVoiceSnapshot()
  const self = state.participants.find((p) => p.id === SELF_ID)
  const sentAt = useRef<number[]>([])
  const hasReactions = state.reactions.length > 0
  const { offers, claims, matches, cooldowns } = state.highFive
  const hfBusy = offers.length > 0 || claims.length > 0
  const [announcement, setAnnouncement] = useState('')
  const [, rerender] = useReducer((n: number) => n + 1, 0)
  const seen = useRef({ offers: new Set<number>(), matches: new Set<number>() })

  useEffect(() => engine.setReducedMotion(reducedMotion), [engine, reducedMotion])

  // Drop expired floating reactions
  useEffect(() => {
    if (!hasReactions) return
    const id = window.setInterval(() => dispatch({ type: 'expireReactions', now: performance.now() }), 500)
    return () => window.clearInterval(id)
  }, [hasReactions, dispatch])

  // Expire open offers and stale "Sudah disambut" toasts
  useEffect(() => {
    if (!hfBusy) return
    const id = window.setInterval(() => dispatch({ type: 'hfTick', now: performance.now() }), 200)
    return () => window.clearInterval(id)
  }, [hfBusy, dispatch])

  // Re-render when the local high-five cooldown ends so the dock button re-enables
  const selfCooldownUntil = cooldowns[SELF_ID] ?? 0
  useEffect(() => {
    const left = selfCooldownUntil - performance.now()
    if (left <= 0) return
    const id = window.setTimeout(() => rerender(), left + 20)
    return () => window.clearTimeout(id)
  }, [selfCooldownUntil])

  // Screen-reader announcements (aria-live polite): new invitations and completed high fives
  useEffect(() => {
    const names = (id: string) => state.participants.find((p) => p.id === id)?.name ?? ''
    for (const o of offers) {
      if (seen.current.offers.has(o.id)) continue
      seen.current.offers.add(o.id)
      if (o.fromId !== SELF_ID) setAnnouncement(`${names(o.fromId)} mengajak high five`)
    }
    for (const m of matches) {
      if (seen.current.matches.has(m.id)) continue
      seen.current.matches.add(m.id)
      setAnnouncement(`${names(m.aId)} dan ${names(m.bId)} high five`)
    }
  }, [offers, matches, state.participants])

  const onHighFive = useCallback(() => {
    const now = performance.now()
    const theirs = offers.find((o) => o.fromId !== SELF_ID)
    if (theirs) dispatch({ type: 'hfRespond', fromId: theirs.fromId, byId: SELF_ID, now })
    else if (offers.some((o) => o.fromId === SELF_ID)) dispatch({ type: 'hfCancel', fromId: SELF_ID })
    else dispatch({ type: 'hfOffer', fromId: SELF_ID, now })
    dispatch({ type: 'closeDock', key: 'reaction' })
  }, [offers, dispatch])

  const onReact = useCallback(
    (name: ReactionName) => {
      const now = performance.now()
      sentAt.current = sentAt.current.filter((t) => now - t < BURST_WINDOW_MS)
      if (sentAt.current.length >= BURST_LIMIT) return
      sentAt.current.push(now)
      const x = REACTION_X_MIN + Math.random() * (REACTION_X_MAX - REACTION_X_MIN)
      dispatch({ type: 'react', senderId: SELF_ID, name, x, now })
    },
    [dispatch],
  )

  const onClose = useCallback((key: DockToggle) => dispatch({ type: 'closeDock', key }), [dispatch])

  if (!self) return null

  const style = { '--crosstalk': voice.crosstalk ? 1 : 0 } as CSSProperties

  return (
    <div className={styles.room} data-motion={reducedMotion ? 'reduced' : 'full'} style={style}>
      <Ambient />
      <TileGrid participants={state.participants} offers={offers} dispatch={dispatch} />
      <TopBar />
      <MutedBanner visible={voice.mutedSpeaking && !self.micOn} onUnmute={() => dispatch({ type: 'setMic', id: SELF_ID, on: true })} />
      <HighFiveToasts
        offers={offers}
        claims={claims}
        participants={state.participants}
        onRespond={(fromId) => dispatch({ type: 'hfRespond', fromId, byId: SELF_ID, now: performance.now() })}
      />
      <HighFiveStage matches={matches} participants={state.participants} sharing={state.toggles.share} onDone={(id) => dispatch({ type: 'hfMatchDone', id })} />
      <div className="sr-only" aria-live="polite">{announcement}</div>
      <ReactionLayer reactions={state.reactions} participants={state.participants} />
      <InfoPill />
      <Dock
        self={self}
        toggles={state.toggles}
        onToggleMic={() => dispatch({ type: 'toggleMic', id: SELF_ID })}
        onToggleCam={() => dispatch({ type: 'toggleCam', id: SELF_ID })}
        onToggleHand={() => dispatch({ type: 'toggleHand', id: SELF_ID })}
        onToggle={(key) => dispatch({ type: 'toggleDock', key })}
        onClose={onClose}
        onReact={onReact}
        onHighFive={onHighFive}
        highFiveActive={offers.some((o) => o.fromId === SELF_ID)}
        highFiveDisabledReason={performance.now() < selfCooldownUntil ? 'Tunggu sebentar sebelum mengajak lagi' : undefined}
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
