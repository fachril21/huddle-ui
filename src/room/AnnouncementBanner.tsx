import { Megaphone, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import styles from './AnnouncementBanner.module.css'

/** Host announcements stay for 30 seconds unless dismissed (Design.md 15.3). */
const ANNOUNCEMENT_MS = 30_000

interface AnnouncementBannerProps {
  announcement: { id: number; text: string } | null
  onDismiss: () => void
}

export function AnnouncementBanner({ announcement, onDismiss }: AnnouncementBannerProps) {
  const id = announcement?.id

  useEffect(() => {
    if (id === undefined) return
    const timer = window.setTimeout(onDismiss, ANNOUNCEMENT_MS)
    return () => window.clearTimeout(timer)
  }, [id, onDismiss])

  return (
    <div className={styles.slot}>
      <AnimatePresence>
        {announcement && (
          <motion.div
            key={announcement.id}
            className={`glass-2 ${styles.banner}`}
            role="status"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <span className={styles.strip} aria-hidden="true" />
            <Megaphone size={18} strokeWidth={1.75} aria-hidden="true" className={styles.icon} />
            <span className={styles.text}>
              <b>Pengumuman host</b>
              {announcement.text}
            </span>
            <button type="button" className={styles.close} aria-label="Tutup pengumuman" onClick={onDismiss}>
              <X size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
