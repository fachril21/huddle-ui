import { initialOf, nameFromEmail, paletteFor } from './people'
import styles from './PeopleStack.module.css'

const SHOWN = 4

/** Overlapping initials for the people invited, plus the host. */
export function PeopleStack({ hostName, invitees }: { hostName: string; invitees: readonly string[] }) {
  const names = [hostName, ...invitees.map(nameFromEmail)]
  const shown = names.slice(0, SHOWN)
  const rest = names.length - shown.length
  return (
    <span className={styles.stack} role="img" aria-label={`${names.length} orang: ${names.slice(0, 3).join(', ')}${names.length > 3 ? ' dan lainnya' : ''}`}>
      {shown.map((name) => (
        <span key={name} className={styles.dot} data-palette={paletteFor(name)} aria-hidden="true">
          {initialOf(name)}
        </span>
      ))}
      {rest > 0 && (
        <span className={styles.more} aria-hidden="true">
          +{rest}
        </span>
      )}
    </span>
  )
}
