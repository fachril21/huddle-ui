import { CalendarPlus, Search, X } from 'lucide-react'
import { useState } from 'react'
import { AgendaGroups } from './AgendaGroups'
import { filterOccurrences } from './meetingFilter'
import type { RoleFilter } from './meetingFilter'
import type { MeetingActions } from './meetingActions'
import { groupByDay } from './schedule'
import type { Occurrence } from './types'
import ui from './ui.module.css'
import styles from './MeetingsPage.module.css'

type Tab = 'upcoming' | 'past'

interface MeetingsPageProps {
  /** Soonest first */
  upcoming: readonly Occurrence[]
  /** Most recent first */
  past: readonly Occurrence[]
  now: Date
  actions: MeetingActions
  onSchedule: () => void
}

const TABS: readonly { id: Tab; label: string }[] = [
  { id: 'upcoming', label: 'Mendatang' },
  { id: 'past', label: 'Sebelumnya' },
]
const ROLES: readonly { id: RoleFilter; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'host', label: 'Anda host' },
  { id: 'invited', label: 'Diundang' },
]

/** Every session in one list: what is coming, what is done, with search and a host/invited filter. */
export function MeetingsPage({ upcoming, past, now, actions, onSchedule }: MeetingsPageProps) {
  const [tab, setTab] = useState<Tab>('upcoming')
  const [role, setRole] = useState<RoleFilter>('all')
  const [query, setQuery] = useState('')

  const source = tab === 'upcoming' ? upcoming : past
  const shown = filterOccurrences(source, query, role)
  const groups = groupByDay(shown, now)
  const filtering = query.trim() !== '' || role !== 'all'

  const empty = filtering ? (
    <>
      <p>{query.trim() ? `Tidak ada rapat yang cocok dengan “${query.trim()}”.` : 'Tidak ada rapat dengan filter ini.'}</p>
      <p>Coba kata lain, atau pilih Semua.</p>
    </>
  ) : tab === 'upcoming' ? (
    <>
      <p>Belum ada rapat mendatang.</p>
      <p>Jadwalkan satu, atau mulai rapat dadakan dari Beranda.</p>
    </>
  ) : (
    <p>Belum ada rapat yang selesai dalam 30 hari terakhir.</p>
  )

  return (
    <>
      <header className={styles.head}>
        <h1>Rapat</h1>
        <button type="button" className={`${ui.btn} ${ui.primary}`} onClick={onSchedule}>
          <CalendarPlus size={16} strokeWidth={1.75} aria-hidden="true" />
          Jadwalkan rapat
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.segment} role="group" aria-label="Tampilkan">
          {TABS.map((t) => (
            <button key={t.id} type="button" aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className={styles.segment} role="group" aria-label="Peran">
          {ROLES.map((r) => (
            <button key={r.id} type="button" aria-pressed={role === r.id} onClick={() => setRole(r.id)}>
              {r.label}
            </button>
          ))}
        </div>
        <div className={styles.search}>
          <Search size={16} strokeWidth={1.75} aria-hidden="true" />
          <input type="search" className={ui.input} placeholder="Cari judul, kode, atau nama" aria-label="Cari rapat" value={query} onChange={(e) => setQuery(e.target.value)} />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Hapus pencarian">
              <X size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <AgendaGroups groups={groups} now={now} actions={actions} showDayLabels empty={empty} />
    </>
  )
}
