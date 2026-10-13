import { getAudio } from './audioEngine'

/** Dry hand clap, about 0.6s with a short tail (Design.md 17): filtered noise bursts with a sharp attack. */
export function playClap() {
  const audio = getAudio()
  if (!audio) return
  const { ctx, groups } = audio
  const t = ctx.currentTime
  const length = Math.floor(ctx.sampleRate * 0.6)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1

  const source = ctx.createBufferSource()
  source.buffer = buffer
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 1700
  band.Q.value = 0.9
  const high = ctx.createBiquadFilter()
  high.type = 'highpass'
  high.frequency.value = 500
  const gain = ctx.createGain()
  // main slap, a quick echo of it, then the room tail
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.9, t + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.18, t + 0.04)
  gain.gain.exponentialRampToValueAtTime(0.5, t + 0.052)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
  source.connect(band).connect(high).connect(gain).connect(groups.effects)
  source.start(t)
  source.stop(t + 0.6)
}
