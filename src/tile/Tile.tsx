import { MicOff } from 'lucide-react'
import type { Participant } from '../state/types'
import { Avatar } from './Avatar'
import { TileLabel } from './TileLabel'
import { VideoPlaceholder } from './VideoPlaceholder'
import styles from './Tile.module.css'

interface TileProps {
  participant: Participant
}

/** Participant card. Layer order follows Design.md 7.1: base, media, effects, label. */
export function Tile({ participant }: TileProps) {
  const { id, name, palette, camOn, micOn } = participant

  return (
    <article
      className={styles.tile}
      data-palette={palette}
      data-tile-id={id}
      data-cam={camOn ? 'on' : 'off'}
      aria-label={`${name}${camOn ? '' : ', kamera mati'}${micOn ? '' : ', mikrofon mati'}`}
    >
      <div className={styles.media}>
        {camOn ? <VideoPlaceholder /> : <Avatar name={name} />}
      </div>
      {!micOn && (
        <span className={`glass-1 ${styles.micOff}`} role="img" aria-label="Mikrofon mati">
          <MicOff size={14} strokeWidth={1.75} aria-hidden="true" />
        </span>
      )}
      <TileLabel participant={participant} />
    </article>
  )
}
