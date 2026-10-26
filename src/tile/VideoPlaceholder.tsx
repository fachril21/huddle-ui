import { imageSources } from '../background/backgrounds'
import type { BackgroundChoice } from '../background/backgrounds'
import { useWorkingSource } from '../background/loadImage'
import { useCustomBackground } from '../background/useCustomBackground'
import type { CameraQuality } from '../room/cameraQuality'
import styles from './VideoPlaceholder.module.css'

/** The chosen picture behind the silhouette. Its own component, so other people's tiles never read the stored upload. */
function Scene({ background }: { background: BackgroundChoice }) {
  const custom = useCustomBackground()
  const picture = useWorkingSource(imageSources(background, custom.url))
  return picture ? <div className={styles.scene} style={{ backgroundImage: `url("${picture}")` }} /> : null
}

interface VideoPlaceholderProps {
  /** Only set on the user's own tile, where it softens the picture to preview what others receive */
  quality?: CameraQuality
  /** Only set on the user's own tile: the stand-in picture shows the chosen background behind the silhouette */
  background?: BackgroundChoice
}

/** Self-made stand-in for a camera feed: abstract silhouette over a very slowly moving gradient. */
export function VideoPlaceholder({ quality, background }: VideoPlaceholderProps) {
  const blur = background?.mode === 'blur' ? background.level : undefined

  return (
    <div className={styles.video} data-quality={quality} data-blur={blur} aria-hidden="true">
      <div className={styles.wash} />
      {background?.mode === 'image' && <Scene background={background} />}
      <svg className={styles.figure} viewBox="0 0 160 100" preserveAspectRatio="xMidYMax meet">
        <ellipse cx="80" cy="115" rx="52" ry="42" />
        <circle cx="80" cy="46" r="21" />
      </svg>
    </div>
  )
}
