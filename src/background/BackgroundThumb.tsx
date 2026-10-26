import { useWorkingSource } from './loadImage'
import styles from './BackgroundPicker.module.css'

interface BackgroundThumbProps {
  sources: readonly string[]
  /** Two colours behind the picture, so the tile is never empty while it loads or if every source fails */
  tint: readonly [string, string]
}

/** A small preview of a background picture. Decorative: the label next to it names it. */
export function BackgroundThumb({ sources, tint }: BackgroundThumbProps) {
  const src = useWorkingSource(sources)
  return (
    <span className={styles.thumb} style={{ backgroundImage: `linear-gradient(145deg, ${tint[0]}, ${tint[1]})` }} aria-hidden="true">
      {src && <img src={src} alt="" decoding="async" draggable={false} />}
    </span>
  )
}
