import type { MediaStatus } from '../../prejoin/mediaState'
import { STATUS_COPY, canRetry } from '../../prejoin/mediaState'
import type { DeviceOption } from '../../prejoin/useMediaPreview'
import styles from './DeviceField.module.css'

interface DeviceFieldProps {
  /** Accessible name; the section heading above already says what the device is */
  label: string
  options: readonly DeviceOption[]
  value: string
  onChange: (id: string) => void
  /** Lets an outside <label htmlFor> name the picker */
  id?: string
}

/** Device picker. "Bawaan sistem" follows whatever the operating system treats as default. */
export function DeviceField({ label, options, value, onChange, id }: DeviceFieldProps) {
  return (
    <select id={id} className={styles.select} aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} disabled={options.length === 0}>
      <option value="">{options.length === 0 ? 'Bawaan sistem' : 'Bawaan sistem (default)'}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

interface DeviceIssueProps {
  status: MediaStatus
  onRetry: () => void
}

/** What went wrong with a device and, when the user can act on it from here, a retry. Renders nothing for healthy states. */
export function DeviceIssue({ status, onRetry }: DeviceIssueProps) {
  const copy = status in STATUS_COPY ? STATUS_COPY[status as keyof typeof STATUS_COPY] : null
  return (
    <div className={styles.issue} role="status" hidden={!copy}>
      {copy && (
        <>
          <p>
            <strong>{copy.title}.</strong> {copy.hint}
          </p>
          {canRetry(status) && (
            <button type="button" className={styles.retry} onClick={onRetry}>
              Coba lagi
            </button>
          )}
        </>
      )}
    </div>
  )
}
