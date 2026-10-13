import { getAudio } from './audioEngine'

/** Soft two-partial "ding" for a raised hand (Design.md 17). */
export function playDing() {
  const audio = getAudio()
  if (!audio) return
  const { ctx, groups } = audio
  const t = ctx.currentTime
  for (const [freq, level] of [[880, 0.16], [1320, 0.07]] as const) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(level, t + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55)
    osc.connect(gain).connect(groups.notify)
    osc.start(t)
    osc.stop(t + 0.6)
  }
}

/** Two short rising notes: a new poll started. */
export function playPollChime() {
  const audio = getAudio()
  if (!audio) return
  const { ctx, groups } = audio
  const t = ctx.currentTime
  ;[[660, 0], [990, 0.11]].forEach(([freq, offset]) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t + offset)
    gain.gain.exponentialRampToValueAtTime(0.14, t + offset + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.3)
    osc.connect(gain).connect(groups.notify)
    osc.start(t + offset)
    osc.stop(t + offset + 0.34)
  })
}
