import { MonitorUp, PencilLine, Square } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useAnnotation } from '../features/annotation/AnnotationContext'
import { AnnotationLayer } from '../features/annotation/AnnotationLayer'
import { AnnotationToolbar } from '../features/annotation/AnnotationToolbar'
import type { Rect } from './layoutMath'
import { ScreenMock } from './ScreenMock'
import { shortcutKey } from './shortcuts'
import styles from './ScreenFrame.module.css'

interface ScreenFrameProps {
  frame: Rect
  /** The presenter's tile rect in the regular grid; the frame grows from / shrinks back to it */
  origin: Rect
  presenterName: string
  isSelf: boolean
  reduced: boolean
  onStop: () => void
}

const FRAME_RADIUS = 20

/** clip-path inset that reveals only `origin` inside `frame` (no width/height animation, content never stretches). */
function insetFor(origin: Rect, frame: Rect): string {
  const top = origin.y - frame.y
  const left = origin.x - frame.x
  const right = frame.x + frame.w - (origin.x + origin.w)
  const bottom = frame.y + frame.h - (origin.y + origin.h)
  return `inset(${top}px ${right}px ${bottom}px ${left}px round ${FRAME_RADIUS}px)`
}

const FULL = `inset(0px 0px 0px 0px round ${FRAME_RADIUS}px)`

/** The shared-screen stage (Design.md 14). It grows out of the presenter tile. */
export function ScreenFrame({ frame, origin, presenterName, isSelf, reduced, onStop }: ScreenFrameProps) {
  const { enabled, blockedByHost, annotating, toggleAnnotating } = useAnnotation()
  const from = reduced ? { opacity: 0 } : { clipPath: insetFor(origin, frame), opacity: 0 }
  const shown = reduced ? { opacity: 1 } : { clipPath: FULL, opacity: 1 }
  return (
    <motion.section
      className={styles.frame}
      style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }}
      initial={from}
      animate={shown}
      exit={{ ...from, transition: { duration: reduced ? 0.15 : 0.44, ease: [0.2, 0.8, 0.2, 1] } }}
      transition={reduced ? { duration: 0.15 } : { duration: 0.56, ease: [0.2, 0.8, 0.2, 1], opacity: { duration: 0.2 } }}
      aria-label={isSelf ? 'Anda sedang berbagi layar' : `Layar yang dibagikan ${presenterName}`}
    >
      <div className={styles.letterbox}>
        <div className={styles.screenBox} data-self={isSelf || undefined}>
          {isSelf ? (
            <div className={styles.self}>
              <MonitorUp size={40} strokeWidth={1.5} aria-hidden="true" />
              <p>Anda sedang berbagi layar</p>
              <button type="button" className={styles.stop} onClick={onStop}>
                <Square size={14} strokeWidth={2} aria-hidden="true" />
                Berhenti berbagi
              </button>
            </div>
          ) : (
            <ScreenMock />
          )}
          <AnnotationLayer />
        </div>
      </div>
      {!isSelf && (
        <span className={`glass-1 ${styles.chip}`}>
          <MonitorUp size={14} strokeWidth={1.75} aria-hidden="true" />
          {presenterName} sedang berbagi layar
        </span>
      )}
      {(enabled || blockedByHost) && (
        <div className={styles.actions}>
          {enabled ? (
            <button type="button" className={`glass-1 ${styles.annotate}`} aria-pressed={annotating} aria-keyshortcuts={shortcutKey('annotate')} onClick={toggleAnnotating}>
              <PencilLine size={16} strokeWidth={1.75} aria-hidden="true" />
              {annotating ? 'Sedang mencoret' : 'Coret layar'}
              <kbd className="keycap">{shortcutKey('annotate')}</kbd>
            </button>
          ) : (
            <span className={`glass-1 ${styles.annotateOff}`}>Coret layar dimatikan host</span>
          )}
        </div>
      )}
      <AnimatePresence>{annotating && <AnnotationToolbar key="annotation-toolbar" />}</AnimatePresence>
    </motion.section>
  )
}
