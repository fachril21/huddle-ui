import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useRef, useState } from 'react'
import type { Dispatch, KeyboardEvent } from 'react'
import type { RoomAction } from '../state/roomReducer'
import type { CameraQuality } from './cameraQuality'
import { SELF_ID } from '../state/types'
import type { HighFiveOffer, LayoutSettings, Participant } from '../state/types'
import { Tile } from '../tile/Tile'
import { useVoiceSnapshot } from '../voice/VoiceContext'
import { useElementSize } from './gridLayout'
import { resolveFocusId } from './focus'
import { useActiveSpeaker } from './hooks/useActiveSpeaker'
import { gridLayout, shareLayout, speakerLayout, spotlightLayout } from './layoutMath'
import { ScreenFrame } from './ScreenFrame'
import { useReducedMotion } from './useReducedMotion'
import styles from './TileGrid.module.css'

interface TileGridProps {
  participants: readonly Participant[]
  offers: readonly HighFiveOffer[]
  sharerId: string | null
  /** Current page of the regular grid (rooms over 9 people) */
  gridPage: number
  soundPlayers: ReadonlySet<string>
  /** Outgoing camera quality, shown on the user's own tile */
  cameraQuality: CameraQuality
  layoutSettings: LayoutSettings
  dispatch: Dispatch<RoomAction>
}

/** After a swap, ignore further swaps briefly so tiles do not ping-pong while layout animates. */
const SWAP_COOLDOWN_MS = 260
/** Stagger between tiles moving into the share strip (Design.md 14.3), capped at 8 tiles. */
const STAGGER_S = 0.024
const MAX_STAGGER_TILES = 8
const TILE_RADIUS = 20

/**
 * Positions every tile absolutely from computed rectangles. The same elements stay mounted when the layout
 * switches between grid and share-screen, so Motion can animate each box (FLIP) without reloading anything.
 */
export function TileGrid({ participants, offers, sharerId, gridPage, soundPlayers, cameraQuality, layoutSettings, dispatch }: TileGridProps) {
  const [stageRef, size] = useElementSize<HTMLDivElement>()
  const reduced = useReducedMotion()
  const voice = useVoiceSnapshot()
  const [page, setPage] = useState(0)
  const cells = useRef(new Map<string, HTMLElement>())
  const lastSwap = useRef(0)

  const { mode, pinnedId, hideNoVideo } = layoutSettings
  const speakerId = useActiveSpeaker(voice.dominantId)

  const ids = useMemo(() => participants.map((p) => p.id), [participants])
  /** Who the layout arranges. "Sembunyikan peserta tanpa kamera" keeps the user and falls back to everyone if nobody is left. */
  const layoutIds = useMemo(() => {
    if (!hideNoVideo || sharerId) return ids
    const withVideo = participants.filter((p) => p.camOn || p.id === SELF_ID).map((p) => p.id)
    return withVideo.length ? withVideo : ids
  }, [participants, ids, hideNoVideo, sharerId])
  const grid = useMemo(() => gridLayout(layoutIds, size.width, size.height, gridPage), [layoutIds, size.width, size.height, gridPage])
  const focusId = mode === 'gallery' ? null : resolveFocusId(layoutIds, { mode, pinnedId, speakerId, selfId: SELF_ID })
  const layout = sharerId
    ? shareLayout(ids, sharerId, size.width, size.height, page)
    : focusId && mode === 'speaker'
      ? speakerLayout(layoutIds, focusId, size.width, size.height, page)
      : focusId && mode === 'spotlight'
        ? spotlightLayout(layoutIds, focusId, size.width, size.height, page)
        : grid
  const reorderable = !sharerId && mode === 'gallery'
  const parkedRect = layout.rects[layoutIds[0]]
  const ready = size.width > 0 && size.height > 0
  const presenter = participants.find((p) => p.id === sharerId)
  const origin = sharerId ? grid.rects[sharerId] : undefined

  /** While dragging, reorder when the pointer enters another cell. */
  const onDrag = (id: string, point: { x: number; y: number }) => {
    if (performance.now() - lastSwap.current < SWAP_COOLDOWN_MS) return
    const px = point.x - window.scrollX
    const py = point.y - window.scrollY
    for (const [otherId, el] of cells.current) {
      if (otherId === id) continue
      const r = el.getBoundingClientRect()
      if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) {
        lastSwap.current = performance.now()
        dispatch({ type: 'moveParticipant', id, toIndex: ids.indexOf(otherId) })
        return
      }
    }
  }

  const onKeyDown = (e: KeyboardEvent, id: string, index: number) => {
    if (!e.altKey || !reorderable) return
    const cols = new Set(Object.values(grid.rects).map((r) => Math.round(r.x))).size
    const step = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' ? -cols : e.key === 'ArrowDown' ? cols : 0
    if (!step) return
    e.preventDefault()
    dispatch({ type: 'moveParticipant', id, toIndex: index + step })
  }

  const pages = layout.pager?.pages ?? 1
  const currentPage = Math.min(page, pages - 1)

  return (
    <div ref={stageRef} className={styles.stage} data-sharing={sharerId ? 'true' : 'false'}>
      {ready && (
        <div className={styles.field} role="list" aria-label="Peserta">
          <AnimatePresence custom={origin}>
            {sharerId && layout.frame && origin && presenter && (
              <ScreenFrame
                key="screen"
                frame={layout.frame}
                origin={origin}
                presenterName={presenter.name}
                isSelf={sharerId === SELF_ID}
                reduced={reduced}
                onStop={() => dispatch({ type: 'stopShare' })}
              />
            )}
          </AnimatePresence>

          {participants.map((p, index) => {
            // people filtered out by "Sembunyikan peserta tanpa kamera" stay mounted, parked invisibly
            const own = layout.rects[p.id]
            const rect = own ?? parkedRect
            if (!rect) return null
            const hidden = layout.hidden.has(p.id) || !own
            const stagger = Math.min(index, MAX_STAGGER_TILES) * STAGGER_S
            return (
              <motion.div
                key={p.id}
                ref={(el) => {
                  if (el) cells.current.set(p.id, el)
                  return () => {
                    cells.current.delete(p.id)
                  }
                }}
                className={styles.cell}
                role="listitem"
                tabIndex={hidden ? -1 : 0}
                aria-hidden={hidden || undefined}
                aria-roledescription="kartu peserta"
                aria-description={reorderable ? 'Seret untuk memindah, atau tahan Alt dan tekan tombol panah' : undefined}
                style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: TILE_RADIUS, pointerEvents: hidden ? 'none' : undefined }}
                layout
                initial={false}
                animate={{ opacity: hidden ? 0 : 1 }}
                transition={
                  reduced
                    ? { duration: 0.15 }
                    : { layout: { type: 'spring', stiffness: 260, damping: 30, delay: sharerId ? stagger : 0 }, opacity: { duration: 0.2 } }
                }
                onTap={() => {
                  if (offers.some((o) => o.fromId === p.id) && p.id !== SELF_ID)
                    dispatch({ type: 'hfRespond', fromId: p.id, byId: SELF_ID, now: performance.now() })
                }}
                drag={reorderable}
                dragSnapToOrigin
                dragElastic={0.12}
                dragMomentum={false}
                whileDrag={{ scale: 1.03, zIndex: 5, cursor: 'grabbing' }}
                onDrag={(_, info) => onDrag(p.id, info.point)}
                onKeyDown={(e) => onKeyDown(e, p.id, index)}
              >
                <Tile
                  participant={p}
                  tileW={Math.round(rect.w)}
                  tileH={Math.round(rect.h)}
                  lit={!hidden && voice.rendered.has(p.id)}
                  dominant={voice.dominantId === p.id}
                  isSelf={p.id === SELF_ID}
                  mutedSpeaking={p.id === SELF_ID && voice.mutedSpeaking}
                  offer={offers.find((o) => o.fromId === p.id) ?? null}
                  compact={rect.h < 160}
                  soundPlaying={soundPlayers.has(p.id)}
                  cameraQuality={p.id === SELF_ID ? cameraQuality : undefined}
                  pinned={mode === 'spotlight' && pinnedId === p.id}
                  onPin={sharerId ? undefined : () => dispatch({ type: 'pinParticipant', id: mode === 'spotlight' && pinnedId === p.id ? null : p.id })}
                />
              </motion.div>
            )
          })}

          {layout.pager && (
            <div className={`glass-1 ${styles.pager}`} style={{ left: layout.pager.x, top: layout.pager.y, width: layout.pager.w }}>
              <button type="button" aria-label="Halaman sebelumnya" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
                <ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />
              </button>
              <span aria-live="polite">
                {currentPage + 1}/{pages}
              </span>
              <button type="button" aria-label="Halaman berikutnya" disabled={currentPage >= pages - 1} onClick={() => setPage(currentPage + 1)}>
                <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
