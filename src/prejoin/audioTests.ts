/** Two-note chime used by the speaker test, as [frequency Hz, start s, length s]. */
const CHIME: ReadonlyArray<readonly [number, number, number]> = [
  [659.25, 0, 0.32],
  [880, 0.28, 0.5],
]
const CHIME_GAIN = 0.18

type SinkContext = AudioContext & { setSinkId?: (id: string) => Promise<void> }

/** True when the browser can route audio to a chosen output (Chromium). */
export function canPickSpeaker(): boolean {
  return typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype
}

/** Play the test chime on the chosen speaker. Resolves when it has finished. */
export async function playTestTone(speakerId: string): Promise<void> {
  const Ctor = window.AudioContext
  if (!Ctor) throw new Error('Audio tidak didukung browser ini')
  const ctx: SinkContext = new Ctor()
  try {
    if (speakerId && ctx.setSinkId) await ctx.setSinkId(speakerId)
    await ctx.resume()
    const end = ctx.currentTime + Math.max(...CHIME.map(([, at, len]) => at + len)) + 0.1
    for (const [freq, at, len] of CHIME) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t0 = ctx.currentTime + at
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(CHIME_GAIN, t0 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + len)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + len + 0.05)
    }
    await new Promise<void>((resolve) => window.setTimeout(resolve, (end - ctx.currentTime) * 1000))
  } finally {
    void ctx.close().catch(() => undefined)
  }
}

export function canRecordClip(): boolean {
  return typeof MediaRecorder !== 'undefined'
}

export const CLIP_MS = 3000

/** Record a short clip from the mic stream; resolves with an object URL for playback. */
export function recordClip(stream: MediaStream, ms = CLIP_MS): { done: Promise<string>; cancel: () => void } {
  const tracks = stream.getAudioTracks()
  const recorder = new MediaRecorder(new MediaStream(tracks))
  const chunks: Blob[] = []
  // A device that stops mid-clip (muted, switched, unplugged) makes the clip unusable
  let cancelled = false
  const abort = () => {
    cancelled = true
    if (recorder.state !== 'inactive') recorder.stop()
  }
  tracks.forEach((t) => t.addEventListener('ended', abort, { once: true }))
  const done = new Promise<string>((resolve, reject) => {
    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data)
    recorder.onerror = () => reject(new Error('Rekaman gagal'))
    recorder.onstop = () => (cancelled ? reject(new Error('cancelled')) : resolve(URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType }))))
    recorder.start()
    window.setTimeout(() => recorder.state !== 'inactive' && recorder.stop(), ms)
  })
  return {
    done,
    cancel: abort,
  }
}

/** Play a recorded clip on the chosen speaker. `done` resolves when playback ends; `stop` cuts it short. */
export function playClip(url: string, speakerId: string): { done: Promise<void>; stop: () => void } {
  const audio = new Audio(url) as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }
  const done = (async () => {
    if (speakerId && audio.setSinkId) await audio.setSinkId(speakerId).catch(() => undefined)
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve()
      audio.onpause = () => resolve()
      audio.onerror = () => reject(new Error('Pemutaran gagal'))
      audio.play().catch(reject)
    })
  })()
  return { done, stop: () => audio.pause() }
}
