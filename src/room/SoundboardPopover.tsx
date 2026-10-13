import { Search, Star, Volume2, VolumeX } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { getGroupVolume, isGroupMuted, setGroupMuted, setGroupVolume } from '../audio/audioEngine'
import { SOUNDS } from '../audio/soundboardSounds'
import { AnimatedEmoji } from '../emoji/AnimatedEmoji'
import { SOUNDBOARD_COOLDOWN_MS } from '../state/roomReducer'
import { useFavoriteSounds } from './useFavoriteSounds'
import styles from './SoundboardPopover.module.css'

interface SoundboardPopoverProps {
  /** performance.now() when the local user's last play happened (0 if never) */
  lastPlayAt: number
  onPlay: (soundId: string) => void
}

type Tab = 'favorit' | 'bawaan'

const RING_R = 22
const RING_C = 2 * Math.PI * RING_R

/** 360x440 glass-2 popover (Design.md 12.2). One global 3s cooldown with a circular countdown on every button. */
export function SoundboardPopover({ lastPlayAt, onPlay }: SoundboardPopoverProps) {
  const [volume, setVolume] = useState(() => Math.round(getGroupVolume('soundboard') * 100))
  const [muted, setMuted] = useState(() => isGroupMuted('soundboard'))
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('bawaan')
  const { favorites, toggle } = useFavoriteSounds()
  const [cooling, setCooling] = useState(() => performance.now() < lastPlayAt + SOUNDBOARD_COOLDOWN_MS)

  // Track the cooldown window so buttons re-enable exactly when it ends
  useEffect(() => {
    const left = lastPlayAt + SOUNDBOARD_COOLDOWN_MS - performance.now()
    if (left <= 0) {
      setCooling(false)
      return
    }
    setCooling(true)
    const id = window.setTimeout(() => setCooling(false), left)
    return () => window.clearTimeout(id)
  }, [lastPlayAt])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SOUNDS.filter((s) => (tab === 'favorit' ? favorites.has(s.id) : true) && (!q || s.name.toLowerCase().includes(q)))
  }, [query, tab, favorites])

  const onVolume = (value: number) => {
    setVolume(value)
    setGroupVolume('soundboard', value / 100)
  }
  const onMute = () => {
    setMuted((m) => {
      setGroupMuted('soundboard', !m)
      return !m
    })
  }

  return (
    <motion.div
      className={`glass-2 ${styles.popover}`}
      role="dialog"
      aria-label="Soundboard"
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97, transition: { duration: 0.12 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
    >
      <header className={styles.head}>
        <h2>Soundboard</h2>
        <button type="button" className={styles.mute} aria-pressed={muted} onClick={onMute}>
          {muted ? <VolumeX size={16} strokeWidth={1.75} aria-hidden="true" /> : <Volume2 size={16} strokeWidth={1.75} aria-hidden="true" />}
          Bisukan soundboard
        </button>
      </header>

      <label className={styles.volume}>
        <span className="sr-only">Volume soundboard</span>
        <input type="range" min={0} max={100} value={volume} onChange={(e) => onVolume(Number(e.target.value))} aria-valuetext={`${volume} persen`} />
        <output aria-live="off">{volume}</output>
      </label>

      <label className={styles.search}>
        <Search size={16} strokeWidth={1.75} aria-hidden="true" />
        <input type="search" placeholder="Cari suara" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Cari suara" />
      </label>

      <div className={styles.tabs} role="tablist" aria-label="Kategori suara">
        {(['favorit', 'bawaan'] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {t === 'favorit' ? 'Favorit' : 'Bawaan'}
          </button>
        ))}
      </div>

      <div className={styles.grid} role="tabpanel">
        {visible.map((s) => (
          <div key={s.id} className={styles.cell}>
            <button
              type="button"
              className={styles.sound}
              data-cooling={cooling}
              aria-disabled={cooling || undefined}
              aria-label={`${s.name}${s.loud ? ', keras' : ''}`}
              onClick={() => !cooling && onPlay(s.id)}
            >
              <AnimatedEmoji name={s.emoji} size={32} />
              <span className={styles.name}>{s.name}</span>
              {s.loud && <span className={styles.loud}>Keras</span>}
              {cooling && (
                <svg key={lastPlayAt} className={styles.ring} viewBox="0 0 48 48" aria-hidden="true">
                  <circle cx="24" cy="24" r={RING_R} strokeDasharray={RING_C} style={{ animationDuration: `${SOUNDBOARD_COOLDOWN_MS}ms` }} />
                </svg>
              )}
            </button>
            <button
              type="button"
              className={styles.star}
              aria-pressed={favorites.has(s.id)}
              aria-label={`${favorites.has(s.id) ? 'Hapus dari' : 'Tambah ke'} favorit: ${s.name}`}
              onClick={() => toggle(s.id)}
            >
              <Star size={14} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        ))}
        {!visible.length && <p className={styles.empty}>{tab === 'favorit' && !query ? 'Belum ada favorit. Tandai bintang pada suara.' : 'Suara tidak ditemukan.'}</p>}
      </div>

      <footer className={styles.foot}>Suara diputar ke semua orang di meeting</footer>
    </motion.div>
  )
}
