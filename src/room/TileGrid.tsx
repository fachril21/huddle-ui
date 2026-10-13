import type { CSSProperties } from 'react'
import type { Participant } from '../state/types'
import { Tile } from '../tile/Tile'
import { bestGrid, GRID_GAP, useElementSize } from './gridLayout'
import styles from './TileGrid.module.css'

export function TileGrid({ participants }: { participants: readonly Participant[] }) {
  const [stageRef, size] = useElementSize<HTMLDivElement>()
  const { cols, tileW, tileH } = bestGrid(participants.length, size.width, size.height)

  const gridStyle = {
    '--tile-w': `${tileW}px`,
    '--tile-h': `${tileH}px`,
    width: cols * tileW + (cols - 1) * GRID_GAP,
  } as CSSProperties

  return (
    <div ref={stageRef} className={styles.stage}>
      {tileW > 0 && (
        <div className={styles.grid} style={gridStyle} role="list" aria-label="Peserta">
          {participants.map((p) => (
            <div key={p.id} role="listitem" className={styles.cell}>
              <Tile participant={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
