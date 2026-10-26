import { ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import { BackgroundPicker } from '../background/BackgroundPicker'
import { describeBackground } from '../background/backgrounds'
import type { BackgroundChoice } from '../background/backgrounds'
import type { Background } from '../background/useBackground'
import styles from './BackgroundSection.module.css'

interface BackgroundSectionProps {
  choice: BackgroundChoice
  onChange: (next: BackgroundChoice) => void
  background: Background
  camOn: boolean
}

/** "Latar" in the lobby panel: folded to one line (what is behind you now), open to the full picker. The mirror stays in view. */
export function BackgroundSection({ choice, onChange, background, camOn }: BackgroundSectionProps) {
  const [open, setOpen] = useState(false)
  const bodyId = useId()
  const titleId = useId()

  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <button type="button" className={styles.toggle} aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen((o) => !o)}>
        <h2 id={titleId}>Latar</h2>
        <span className={styles.summary} data-on={choice.mode !== 'none' || undefined}>
          {describeBackground(background.applied)}
        </span>
        <ChevronDown size={18} strokeWidth={1.75} aria-hidden="true" className={styles.chevron} />
      </button>
      <div id={bodyId} className={styles.body} hidden={!open}>
        <BackgroundPicker choice={choice} onChange={onChange} custom={background.custom} status={background.status} failure={background.failure} camOn={camOn} />
      </div>
    </section>
  )
}
