import { MicOff, Pin, PinOff } from 'lucide-react'
import type { Participant } from '../state/types'
import { useFx } from '../room/MotionContext'
import { useTileRegistration } from '../voice/VoiceContext'
import type { BackgroundChoice } from '../background/backgrounds'
import type { CameraQuality } from '../room/cameraQuality'
import { Aurora } from './Aurora'
import { Avatar } from './Avatar'
import { NeonBorder } from './NeonBorder'
import { TileLabel } from './TileLabel'
import { ConnectionOverlay, HandOverlay, OfferOverlay, StatusOverlay, WakeOverlay } from './TileOverlays'
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
  /** Tile is small (under 160px tall): aurora gives way to a static glow (Design.md 7.5) */
  compact: boolean
  /** This participant is playing a soundboard sound right now */
  soundPlaying: boolean
  /** Outgoing camera quality; only passed for the user's own tile */
  cameraQuality?: CameraQuality
  /** Only set on the user's own tile */
  background?: BackgroundChoice
  /** Sorotan: this person is the pinned one */
  pinned?: boolean
  /** Toggles the pin; omitted while sharing a screen */
  onPin?: () => void
}

/** Participant card. Layer order follows Design.md 7.1: base, media, aurora/glow, neon, overlays, label. */
export function Tile({ participant, tileW, tileH, lit, dominant, mutedSpeaking, isSelf, offer, compact, soundPlaying, cameraQuality, background, pinned = false, onPin }: TileProps) {
  const { id, name, palette, camOn, micOn, status } = participant
  const registerTile = useTileRegistration(id)
  const { fx } = useFx()
  // Hemat: camera-off tiles keep a thin aurora (no ripple ring), one comet. Mati: ring colour only (Design.md 19.1)
  const softGlow = compact || fx === 'lite'
  const showAurora = !camOn && !compact && fx !== 'off'
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
      data-away={status === 'none' ? undefined : status}
      data-sound={soundPlaying}
      aria-label={[name, ...notes].join(', ')}
    >
      <div className={styles.media}>
        {camOn || (softGlow && !showAurora) ? (
          <>
            {camOn && <VideoPlaceholder quality={cameraQuality} background={background} />}
            {lit && <div className={styles.glowIn} aria-hidden="true" />}
            {!camOn && <Avatar name={name} />}
          </>
        ) : (
          <>
            {lit && showAurora && <Aurora thin={fx === 'lite'} />}
            <Avatar name={name} />
          </>
        )}
      </div>
      {lit && <NeonBorder dominant={dominant} simple={fx !== 'full'} />}
      {soundPlaying && <div className={styles.soundPulse} aria-hidden="true" />}
      <ConnectionOverlay participant={participant} />
      <HandOverlay participant={participant} tileW={tileW} tileH={tileH} />
      <OfferOverlay participant={participant} tileW={tileW} tileH={tileH} offer={offer} />
      <StatusOverlay participant={participant} tileW={tileW} tileH={tileH} />
      <WakeOverlay participant={participant} />
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
      <TileLabel participant={participant} quality={cameraQuality} compact={compact} />
      {onPin && (
        <button
          type="button"
          className={`glass-1 ${styles.pin}`}
          aria-pressed={pinned}
          aria-label={pinned ? `Lepas sorotan ${name}` : `Sorot ${name}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onPin}
        >
          {pinned ? <PinOff size={14} strokeWidth={1.75} aria-hidden="true" /> : <Pin size={14} strokeWidth={1.75} aria-hidden="true" />}
        </button>
      )}
    </article>
  )
}
