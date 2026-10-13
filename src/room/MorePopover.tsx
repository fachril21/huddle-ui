import { motion } from 'motion/react'
import { useState } from 'react'
import { getGroupVolume, isGroupMuted, setGroupMuted, setGroupVolume } from '../audio/audioEngine'
import type { SoundGroup } from '../audio/audioEngine'
import type { FxTier } from '../state/types'
import styles from './MorePopover.module.css'

interface MorePopoverProps {
  fx: FxTier
  onFx: (fx: FxTier) => void
}

const TIERS: readonly { fx: FxTier; label: string; hint: string }[] = [
  { fx: 'full', label: 'Penuh', hint: 'Semua efek' },
  { fx: 'lite', label: 'Hemat', hint: 'Efek lebih ringan' },
  { fx: 'off', label: 'Mati', hint: 'Tanpa efek' },
]

const GROUPS: readonly { group: SoundGroup; label: string }[] = [
  { group: 'notify', label: 'Notifikasi' },
  { group: 'effects', label: 'Efek (high five)' },
  { group: 'soundboard', label: 'Soundboard' },
]

/** "Lainnya": effects tier (Design.md 19.1) and the three sound volume groups (Design.md 17). */
export function MorePopover({ fx, onFx }: MorePopoverProps) {
  return (
    <motion.div
      className={`glass-2 ${styles.popover}`}
      role="dialog"
      aria-label="Lainnya"
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97, transition: { duration: 0.12 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
    >
      <section aria-label="Efek visual">
        <h2>Efek visual</h2>
        <div className={styles.segment} role="group" aria-label="Tingkat efek visual">
          {TIERS.map((t) => (
            <button key={t.fx} type="button" aria-pressed={fx === t.fx} title={t.hint} onClick={() => onFx(t.fx)}>
              {t.label}
            </button>
          ))}
        </div>
        <p className={styles.hint}>{TIERS.find((t) => t.fx === fx)?.hint}. Hemat dan Mati cocok untuk perangkat lemah.</p>
      </section>

      <section aria-label="Volume">
        <h2>Volume suara</h2>
        {GROUPS.map((g) => (
          <VolumeRow key={g.group} group={g.group} label={g.label} />
        ))}
      </section>
    </motion.div>
  )
}

function VolumeRow({ group, label }: { group: SoundGroup; label: string }) {
  const [value, setValue] = useState(() => Math.round(getGroupVolume(group) * 100))
  const [muted, setMuted] = useState(() => isGroupMuted(group))
  return (
    <div className={styles.row}>
      <span>{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        aria-label={`Volume ${label}`}
        aria-valuetext={`${value} persen`}
        onChange={(e) => {
          const v = Number(e.target.value)
          setValue(v)
          setGroupVolume(group, v / 100)
        }}
      />
      <button
        type="button"
        aria-pressed={muted}
        aria-label={`Bisukan ${label}`}
        onClick={() => {
          setMuted(!muted)
          setGroupMuted(group, !muted)
        }}
      >
        {muted ? 'Bisu' : 'Hidup'}
      </button>
    </div>
  )
}
