import { PUSH_TO_TALK, SHORTCUTS } from '../../room/shortcuts'
import styles from '../sections.module.css'

/** The keys the room answers to. Read-only: one key each, no modifiers. */
export function ShortcutsSection() {
  const all = [...SHORTCUTS.map((s) => ({ id: s.id, key: s.key, label: s.label })), { id: 'ptt', key: PUSH_TO_TALK.key, label: PUSH_TO_TALK.label }]
  return (
    <>
      <p className={styles.lead}>Pintasan bekerja di dalam rapat, selama kursor tidak sedang di kolom ketik. Di layar sentuh pintasan dimatikan.</p>
      <ul className={styles.keys}>
        {all.map((s) => (
          <li key={s.id}>
            <span>{s.label}</span>
            <kbd className="keycap">{s.key}</kbd>
          </li>
        ))}
      </ul>
    </>
  )
}
