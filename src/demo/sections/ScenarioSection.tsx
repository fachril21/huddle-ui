import { Pause, Play, RotateCcw } from 'lucide-react'
import { SCENARIOS } from '../scenarios'
import styles from '../DemoDirector.module.css'
import type { ScenarioPlayer } from '../useScenarioPlayer'

function clock(seconds: number): string {
  const s = Math.floor(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Pick a script, play/pause/restart it, and change its speed (PRD 9). */
export function ScenarioSection({ player }: { player: ScenarioPlayer }) {
  const { scenario, status, elapsed, speed } = player
  const playing = status === 'playing'
  const pct = Math.min(100, (elapsed / scenario.durationS) * 100)

  return (
    <div className={styles.stack}>
      <label className={styles.pick}>
        <span>Skrip</span>
        <select value={scenario.id} onChange={(e) => player.select(e.target.value)}>
          {SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.presets}>
        <button type="button" className={styles.btn} onClick={player.toggle}>
          {playing ? <Pause size={12} strokeWidth={2} aria-hidden="true" /> : <Play size={12} strokeWidth={2} aria-hidden="true" />}
          {playing ? 'Jeda' : status === 'paused' ? 'Lanjut' : 'Putar'}
        </button>
        <button type="button" className={styles.btn} onClick={player.restart}>
          <RotateCcw size={12} strokeWidth={2} aria-hidden="true" />
          Mulai ulang
        </button>
        <span className={styles.seg} role="group" aria-label="Kecepatan">
          {([1, 1.5] as const).map((v) => (
            <button key={v} type="button" className={styles.btn} aria-pressed={speed === v} onClick={() => player.setSpeed(v)}>
              {v}x
            </button>
          ))}
        </span>
      </div>

      <div className={styles.progress} role="progressbar" aria-label="Kemajuan skenario" aria-valuemin={0} aria-valuemax={scenario.durationS} aria-valuenow={Math.round(elapsed)}>
        <i style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
      <p className={styles.note}>
        {clock(elapsed)} / {clock(scenario.durationS)} · {status === 'done' ? 'selesai' : status === 'idle' ? 'siap' : status === 'paused' ? 'dijeda' : 'berjalan'}. Tutup panel dengan Shift+D saat presentasi.
      </p>
    </div>
  )
}
