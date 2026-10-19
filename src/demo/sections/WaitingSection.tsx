import type { Dispatch } from 'react'
import type { Admission, AdmissionAction, AdmissionStatus } from '../../waiting/admission'
import styles from '../DemoDirector.module.css'
import { Toggle } from '../controls'

const OUTCOMES: readonly { readonly status: AdmissionStatus; readonly label: string }[] = [
  { status: 'admitted', label: 'Host mengizinkan' },
  { status: 'denied', label: 'Host menolak' },
  { status: 'timeout', label: 'Tidak ada respons' },
  { status: 'host-absent', label: 'Host belum hadir' },
  { status: 'locked', label: 'Rapat dikunci' },
  { status: 'waiting', label: 'Kembali menunggu' },
]

/** Answers for a guest standing in the waiting room. Only live while the waiting screen is open. */
export function WaitingSection({ admission, onAdmission }: { admission: Admission | null; onAdmission: Dispatch<AdmissionAction> }) {
  return (
    <div className={styles.stack}>
      <p className={styles.note}>{admission ? `Status tamu: ${admission.status}` : 'Buka rapat Review desain mingguan lewat Join untuk melihat ruang tunggu.'}</p>
      <div className={styles.presets} role="group" aria-label="Jawaban host">
        {OUTCOMES.map(({ status, label }) => (
          <Toggle key={status} label={label} on={admission?.status === status} onClick={() => admission && onAdmission({ type: 'resolve', status })} />
        ))}
      </div>
    </div>
  )
}
