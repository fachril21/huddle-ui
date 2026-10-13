import { MicOff } from 'lucide-react'
import type { Participant } from '../state/types'
import { useTileRegistration } from '../voice/VoiceContext'
import { Aurora } from './Aurora'
import { Avatar } from './Avatar'
import { NeonBorder } from './NeonBorder'
import { TileLabel } from './TileLabel'
import { ConnectionOverlay, HandOverlay, OfferOverlay, StatusOverlay } from './TileOverlays'
import { VideoPlaceholder } from './VideoPlaceholder'
import styles from './Tile.module.css'

interface TileProps {
  participant: Participant
  tileW: number
  tileH: number
  /** Tile is rendering voice effects (speaking, holding, or fading) */
  lit: boolean
  dominant: boolean
  /** Only meaningful on the self tile */
  mutedSpeaking: boolean
  isSelf: boolean
  /** Open high-five offer from this participant */
  offer: { startedAt: number; expiresAt: number } | null
}

/** Participant card. Layer order follows Design.md 7.1: base, media, aurora/glow, neon, overlays, label. */
export function Tile({ participant, tileW, tileH, lit, dominant, mutedSpeaking, isSelf, offer }: TileProps) {
  const { id, name, palette, camOn, micOn, status } = participant
  const registerTile = useTileRegistration(id)
  const notes = [camOn ? '' : 'kamera mati', micOn ? '' : 'mikrofon mati', status === 'none' ? '' : status.toUpperCase()].filter(Boolean)

  return (
    <article
      ref={registerTile}
      className={styles.tile}
      data-palette={palette}
      data-tile-id={id}
      data-cam={camOn ? 'on' : 'off'}
      data-lit={lit}
      data-dominant={lit && dominant}
      data-away={status !== 'none'}
      aria-label={[name, ...notes].join(', ')}
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
      <ConnectionOverlay participant={participant} />
      <HandOverlay participant={participant} tileW={tileW} tileH={tileH} />
      <OfferOverlay participant={participant} tileW={tileW} tileH={tileH} offer={offer} />
      <StatusOverlay participant={participant} tileW={tileW} tileH={tileH} />
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
