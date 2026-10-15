import { useId, useState } from 'react'
import { Modal } from './Modal'
import { formatTimeRange, dayLabel } from './schedule'
import type { Occurrence } from './types'
import ui from './ui.module.css'
import styles from './CancelDialog.module.css'

export type CancelScope = 'single' | 'series'

interface CancelDialogProps {
  occurrence: Occurrence
  now: Date
  onClose: () => void
  onConfirm: (scope: CancelScope) => void
}

/** Cancelling a repeating meeting asks which part; a one-off just asks for confirmation. */
export function CancelDialog({ occurrence, now, onClose, onConfirm }: CancelDialogProps) {
  const { meeting } = occurrence
  const repeating = meeting.recurrence !== 'none'
  const [scope, setScope] = useState<CancelScope>('single')
  const uid = useId()

  return (
    <Modal
      title="Batalkan rapat?"
      onClose={onClose}
      width={480}
      footer={
        <>
          <button type="button" className={ui.btn} onClick={onClose} data-autofocus>
            Tidak jadi
          </button>
          <button type="button" className={`${ui.btn} ${ui.danger}`} onClick={() => onConfirm(repeating ? scope : 'series')}>
            Batalkan rapat
          </button>
        </>
      }
    >
      <p className={styles.what}>
        <strong>{meeting.title}</strong>
        {dayLabel(occurrence.start, now)}, {formatTimeRange(occurrence)}
      </p>
      <p className={styles.note}>Peserta yang sudah punya tautannya tidak akan bisa masuk ke jadwal ini. Pembatalan tidak bisa diurungkan.</p>
      {repeating && (
        <fieldset className={styles.scope}>
          <legend className={ui.label}>Yang dibatalkan</legend>
          <label>
            <input type="radio" name={`${uid}-scope`} checked={scope === 'single'} onChange={() => setScope('single')} />
            Sesi ini saja
          </label>
          <label>
            <input type="radio" name={`${uid}-scope`} checked={scope === 'series'} onChange={() => setScope('series')} />
            Seluruh seri
          </label>
        </fieldset>
      )}
    </Modal>
  )
}
