import { MicOff } from 'lucide-react'
import type { Participant } from '../state/types'
import { useTileRegistration } from '../voice/VoiceContext'
import { Aurora } from './Aurora'
import { Avatar } from './Avatar'
import { NeonBorder } from './NeonBorder'
import { TileLabel } from './TileLabel'
import { VideoPlaceholder } from './VideoPlaceholder'
import styles from './Tile.module.css'

interface TileProps {
  participant: Participant
  /** Tile is rendering voice effects (speaking, holding, or fading) */
  lit: boolean
  dominant: boolean
  /** Only meaningful on the self tile */
  mutedSpeaking: boolean
  isSelf: boolean
}

/** Participant card. Layer order follows Design.md 7.1: base, media, aurora/glow, neon, label. */
export function Tile({ participant, lit, dominant, mutedSpeaking, isSelf }: TileProps) {
  const { id, name, palette, camOn, micOn } = participant
  const registerTile = useTileRegistration(id)

  return (
    <article
      ref={registerTile}
      className={styles.tile}
      data-palette={palette}
      data-tile-id={id}
      data-cam={camOn ? 'on' : 'off'}
      data-lit={lit}
      data-dominant={lit && dominant}
      aria-label={`${name}${camOn ? '' : ', kamera mati'}${micOn ? '' : ', mikrofon mati'}`}
    >
      <div className={styles.media}>
        {camOn ? (
          <>
            <VideoPlaceholder />
            {lit && <div className={styles.glowIn} aria-hidden="true" />}
          </>
        ) : (
          <>
            {lit && <Aurora />}
            <Avatar name={name} />
          </>
        )}
      </div>
      {lit && <NeonBorder dominant={dominant} />}
      {isSelf && (
        <div className={styles.muted} data-on={mutedSpeaking} aria-hidden="true">
          <div className={styles.mutedPulse} />
        </div>
      )}
      {!micOn && (
        <span className={`glass-1 ${styles.micOff}`} role="img" aria-label="Mikrofon mati">
          <MicOff size={14} strokeWidth={1.75} aria-hidden="true" />
        </span>
      )}
      <TileLabel participant={participant} />
    </article>
  )
}
