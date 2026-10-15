import { Check, CircleDashed, TriangleAlert } from 'lucide-react'
import { useId } from 'react'
import type { ReactNode } from 'react'
import { STATUS_COPY, canRetry } from './mediaState'
import type { CheckState, MediaStatus } from './mediaState'
import type { DeviceOption } from './useMediaPreview'
import styles from './CheckRow.module.css'

const BADGE: Record<CheckState, { label: string; Icon: typeof Check }> = {
  ready: { label: 'Siap', Icon: Check },
  attention: { label: 'Perlu dicek', Icon: TriangleAlert },
  untested: { label: 'Belum dites', Icon: CircleDashed },
}

interface CheckRowProps {
  icon: ReactNode
  title: string
  state: CheckState
  options: readonly DeviceOption[]
  value: string
  onChange: (id: string) => void
  /** Set when the device failed; shows what happened and, when useful, a retry */
  issue?: MediaStatus
  onRetry?: () => void
  /** Hide the picker (browser can't route output) */
  hidePicker?: boolean
  children?: ReactNode
}

/** One device in the checklist: name, status badge, device picker, and any extra test controls. */
export function CheckRow({ icon, title, state, options, value, onChange, issue, onRetry, hidePicker = false, children }: CheckRowProps) {
  const selectId = useId()
  const { label, Icon } = BADGE[state]
  const copy = issue && issue in STATUS_COPY ? STATUS_COPY[issue as keyof typeof STATUS_COPY] : null

  return (
    <li className={styles.row} data-state={state}>
      <div className={styles.head}>
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
        {hidePicker ? (
          <span className={styles.title}>{title}</span>
        ) : (
          <label htmlFor={selectId} className={styles.title}>
            {title}
          </label>
        )}
        <span className={styles.badge} data-state={state}>
          <Icon size={14} strokeWidth={2} aria-hidden="true" />
          {label}
        </span>
      </div>
      {!hidePicker && (
        <select id={selectId} className={styles.select} value={value} onChange={(e) => onChange(e.target.value)} disabled={options.length === 0}>
          <option value="">{options.length === 0 ? 'Bawaan sistem' : 'Bawaan sistem (default)'}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      )}
      <div className={styles.issue} role="status" hidden={!copy}>
        {copy && (
          <>
            <p>
              <strong>{copy.title}.</strong> {copy.hint}
            </p>
            {issue && canRetry(issue) && onRetry && (
              <button type="button" className={styles.retry} onClick={onRetry}>
                Coba lagi
              </button>
            )}
          </>
        )}
      </div>
      {children}
    </li>
  )
}
