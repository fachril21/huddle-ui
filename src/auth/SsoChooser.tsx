import { Modal } from '../dashboard/Modal'
import { initialOf, paletteFor } from '../dashboard/people'
import { GoogleMark } from './GoogleMark'
import { DEMO_GOOGLE_ACCOUNTS } from './ssoAccounts'
import type { GoogleAccount } from './ssoAccounts'
import styles from './SsoChooser.module.css'

interface SsoChooserProps {
  onPick: (account: GoogleAccount) => void
  onClose: () => void
}

/** Stand-in for Google's account chooser (demo accounts, see ssoAccounts.ts). */
export function SsoChooser({ onPick, onClose }: SsoChooserProps) {
  return (
    <Modal title="Pilih akun Google" width={420} onClose={onClose}>
      <p className={styles.lead}>
        <GoogleMark size={18} />
        Lanjutkan ke Huddle dengan akun Google
      </p>
      <ul className={styles.list}>
        {DEMO_GOOGLE_ACCOUNTS.map((account, i) => (
          <li key={account.email}>
            <button type="button" className={styles.account} data-palette={paletteFor(account.name)} data-autofocus={i === 0 ? '' : undefined} onClick={() => onPick(account)}>
              <span className={styles.avatar} aria-hidden="true">
                {initialOf(account.name)}
              </span>
              <span className={styles.text}>
                <span className={styles.name}>{account.name}</span>
                <span className={styles.email}>{account.email}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className={styles.note}>Akun contoh untuk prototype. Di produksi, daftar ini datang dari Google.</p>
    </Modal>
  )
}
