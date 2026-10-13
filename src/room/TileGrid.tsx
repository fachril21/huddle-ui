import { motion } from 'motion/react'
import { useRef } from 'react'
import type { CSSProperties, Dispatch, KeyboardEvent } from 'react'
import type { RoomAction } from '../state/roomReducer'
import { SELF_ID } from '../state/types'
import type { Participant } from '../state/types'
import { Tile } from '../tile/Tile'
import { useVoiceSnapshot } from '../voice/VoiceContext'
import { bestGrid, GRID_GAP, useElementSize } from './gridLayout'
import styles from './TileGrid.module.css'

interface TileGridProps {
  participants: readonly Participant[]
  dispatch: Dispatch<RoomAction>
}

/** After a swap, ignore further swaps briefly so tiles do not ping-pong while layout animates. */
const SWAP_COOLDOWN_MS = 260

export function TileGrid({ participants, dispatch }: TileGridProps) {
  const [stageRef, size] = useElementSize<HTMLDivElement>()
  const { cols, tileW, tileH } = bestGrid(participants.length, size.width, size.height)
  const voice = useVoiceSnapshot()
  const cells = useRef(new Map<string, HTMLElement>())
  const lastSwap = useRef(0)

  const gridStyle = {
    '--tile-w': `${tileW}px`,
    '--tile-h': `${tileH}px`,
    width: cols * tileW + (cols - 1) * GRID_GAP,
  } as CSSProperties

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
        dispatch({ type: 'moveParticipant', id, toIndex: participants.findIndex((p) => p.id === otherId) })
        return
      }
    }
  }

  const onKeyDown = (e: KeyboardEvent, id: string, index: number) => {
    if (!e.altKey) return
    const step = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' ? -cols : e.key === 'ArrowDown' ? cols : 0
    if (!step) return
    e.preventDefault()
    dispatch({ type: 'moveParticipant', id, toIndex: index + step })
  }

  return (
    <div ref={stageRef} className={styles.stage}>
      {tileW > 0 && (
        <div className={styles.grid} style={gridStyle} role="list" aria-label="Peserta">
          {participants.map((p, index) => (
            <motion.div
              key={p.id}
              ref={(el) => {
                if (el) cells.current.set(p.id, el)
                return () => { cells.current.delete(p.id) }
              }}
              className={styles.cell}
              role="listitem"
              tabIndex={0}
              aria-roledescription="kartu peserta yang bisa dipindah"
              aria-description="Seret untuk memindah, atau tahan Alt dan tekan tombol panah"
              layout="position"
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              drag
              dragSnapToOrigin
              dragElastic={0.12}
              dragMomentum={false}
              whileDrag={{ scale: 1.03, zIndex: 5, cursor: 'grabbing' }}
              onDrag={(_, info) => onDrag(p.id, info.point)}
              onKeyDown={(e) => onKeyDown(e, p.id, index)}
            >
              <Tile
                tileW={tileW}
                tileH={tileH}
                participant={p}
                lit={voice.rendered.has(p.id)}
                dominant={voice.dominantId === p.id}
                isSelf={p.id === SELF_ID}
                mutedSpeaking={p.id === SELF_ID && voice.mutedSpeaking}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
