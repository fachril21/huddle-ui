import { Check, TriangleAlert } from 'lucide-react'
import { deviceLine, deviceProblems } from './mediaState'
import type { DeviceFacts } from './mediaState'
import type { DevicePanel } from './StageControls'
import styles from './DeviceStatus.module.css'

const KIND_LABEL: Record<DevicePanel, string> = { camera: 'Kamera', mic: 'Mikrofon' }

/**
 * The lobby's whole answer about devices, in one place: calm when they work, and when one does not, which one and a
 * button that opens its menu on the stage. Everything else about devices lives in those menus.
 */
export function DeviceStatus({ facts, onOpen }: { facts: DeviceFacts; onOpen: (panel: DevicePanel) => void }) {
  const problems = deviceProblems(facts)

  if (problems.length === 0) {
    return (
      <p className={styles.line} role="status">
        <Check size={16} strokeWidth={2} aria-hidden="true" className={styles.ok} />
        {deviceLine(facts)}
      </p>
    )
  }

  return (
    <ul className={styles.problems} role="status">
      {problems.map((p) => (
        <li key={p.kind} className={styles.line}>
          <TriangleAlert size={16} strokeWidth={1.75} aria-hidden="true" className={styles.warn} />
          <span className={styles.text}>
            <strong>{KIND_LABEL[p.kind]}:</strong> {p.title}
          </span>
          <button type="button" className={styles.fix} onClick={() => onOpen(p.kind)}>
            Atur
          </button>
        </li>
      ))}
    </ul>
  )
}
