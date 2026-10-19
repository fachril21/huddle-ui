import { Clapperboard, X } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import ui from '../dashboard/ui.module.css'
import { Sheet } from '../mobile/Sheet'
import { useViewport } from '../mobile/useViewport'
import { RecordingDetail } from './RecordingDetail'
import type { RecordingActions } from './recordingActions'
import { RecordingRow } from './RecordingRow'
import { groupRecordings } from './retention'
import type { Recording } from './types'
import styles from './RecordingsPage.module.css'

interface RecordingsPageProps {
  recordings: readonly Recording[]
  now: Date
  actions: Omit<RecordingActions, 'open'>
}

interface Selection {
  readonly id: string
  readonly askDelete: boolean
}

/** Every recording the user can reach: what is recording now, what can still be downloaded, and what has expired. */
export function RecordingsPage({ recordings, now, actions }: RecordingsPageProps) {
  const { sizeClass } = useViewport()
  const docked = sizeClass === 'desktop'
  const [selection, setSelection] = useState<Selection | null>(null)
  const { live, active, traces } = groupRecordings(recordings, now)

  const selected = selection ? recordings.find((r) => r.id === selection.id) ?? null : null
  const close = () => setSelection(null)

  const rowActions: RecordingActions = {
    ...actions,
    open: (r, intent) => setSelection({ id: r.id, askDelete: intent === 'delete' }),
  }

  const section = (id: string, title: string, note: string, items: readonly Recording[], tone?: 'live') => {
    if (items.length === 0) return null
    return (
      <section aria-labelledby={id} className={styles.section} data-tone={tone}>
        <div className={styles.sectionHead}>
          <h2 id={id}>{title}</h2>
          <span>{note}</span>
        </div>
        <ul className={styles.list}>
          {items.map((r) => (
            <RecordingRow key={r.id} recording={r} now={now} selected={selected?.id === r.id} actions={rowActions} />
          ))}
        </ul>
      </section>
    )
  }

  const nothing = live.length + active.length + traces.length === 0

  const detail: ReactNode = selected ? <RecordingDetail key={`${selected.id}:${selection?.askDelete}`} recording={selected} now={now} askDelete={selection?.askDelete ?? false} actions={rowActions} /> : null

  return (
    <div className={styles.layout} data-docked={docked && selected ? '' : undefined}>
      <div className={styles.listColumn}>
        <header className={styles.head}>
          <h1>Rekaman</h1>
          <div className={styles.rules}>
            <p>Disimpan 24 jam setelah rapat selesai atau ruangan kosong, lalu dihapus otomatis.</p>
            <p>Rekaman berhenti sendiri saat orang terakhir keluar dari ruangan.</p>
          </div>
        </header>

        {nothing ? (
          <div className={styles.empty}>
            <Clapperboard size={28} strokeWidth={1.5} aria-hidden="true" />
            <h2>Belum ada rekaman</h2>
            <p>Host bisa mulai merekam dari Alat host di dalam rapat. Hasilnya muncul di sini dan tersimpan 24 jam.</p>
          </div>
        ) : (
          <>
            {section('rec-live', 'Sedang merekam', `${live.length} rapat`, live, 'live')}
            {section('rec-active', 'Tersedia', active.length > 0 ? 'Yang paling cepat dihapus ada di atas' : '', active)}
            {section('rec-expired', 'Sudah dihapus', 'Catatannya hilang setelah 7 hari', traces)}
            {active.length === 0 && live.length === 0 && (
              <p className={styles.quiet}>Tidak ada rekaman yang masih bisa diunduh. Rekaman baru muncul di sini setelah rapat direkam.</p>
            )}
          </>
        )}
      </div>

      {docked && selected && (
        <aside className={`glass-2 ${styles.panel}`} aria-label={`Detail ${selected.title}`} onKeyDown={(e) => e.key === 'Escape' && close()}>
          <div className={styles.panelHead}>
            <h2>Detail rekaman</h2>
            <button type="button" className={`${ui.btn} ${ui.icon}`} onClick={close} aria-label="Tutup detail">
              <X size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
          {detail}
        </aside>
      )}
      {!docked && selected && (
        <Sheet title={selected.title} size="tall" quietTitle onClose={close}>
          {detail}
        </Sheet>
      )}
    </div>
  )
}
