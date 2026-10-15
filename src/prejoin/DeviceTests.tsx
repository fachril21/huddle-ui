import { Mic, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CLIP_MS, canRecordClip, playClip, playTestTone, recordClip } from './audioTests'
import styles from './DeviceTests.module.css'

interface SpeakerTestProps {
  speakerId: string
  confirmed: boolean
  onConfirm: (heard: boolean) => void
}

type Phase = 'idle' | 'busy' | 'asked' | 'failed'

/** Plays a chime on the chosen speaker, then asks whether it was heard. Only a "yes" makes the speaker ready. */
export function SpeakerTest({ speakerId, confirmed, onConfirm }: SpeakerTestProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [missed, setMissed] = useState(false)

  const run = async () => {
    setPhase('busy')
    setMissed(false)
    try {
      await playTestTone(speakerId)
      setPhase('asked')
    } catch {
      setPhase('failed')
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.line}>
        <button type="button" className={styles.btn} onClick={phase === 'busy' ? undefined : run} aria-disabled={phase === 'busy' || undefined}>
          <Volume2 size={14} strokeWidth={2} aria-hidden="true" />
          {phase === 'busy' ? 'Memutar…' : confirmed ? 'Putar lagi' : 'Tes speaker'}
        </button>
        {phase === 'asked' && !confirmed && (
          <span className={styles.ask} role="group" aria-label="Apakah nada terdengar?">
            Terdengar?
            <button type="button" className={styles.chip} onClick={() => onConfirm(true)}>
              Ya
            </button>
            <button type="button" className={styles.chip} onClick={() => setMissed(true)}>
              Belum
            </button>
          </span>
        )}
      </div>
      <p className={styles.note} role="status">
        {missed && 'Naikkan volume, atau pilih speaker lain di atas, lalu putar lagi.'}
        {phase === 'failed' && 'Nada tidak bisa diputar di perangkat ini. Coba pilih speaker lain.'}
      </p>
    </div>
  )
}

type MicPhase = 'idle' | 'recording' | 'playing' | 'done' | 'failed'

/** Records three seconds of the user's voice and plays it back, the way Zoom's mic test does. */
export function MicTest({ stream, speakerId }: { stream: MediaStream | null; speakerId: string }) {
  const [phase, setPhase] = useState<MicPhase>('idle')
  const cancelRef = useRef<(() => void) | null>(null)
  const stopRef = useRef<(() => void) | null>(null)
  const urlRef = useRef<string | null>(null)

  useEffect(
    () => () => {
      cancelRef.current?.()
      stopRef.current?.()
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    },
    [],
  )

  if (!canRecordClip()) return null

  const run = async () => {
    if (!stream) return
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    setPhase('recording')
    try {
      const clip = recordClip(stream)
      cancelRef.current = clip.cancel
      urlRef.current = await clip.done
      setPhase('playing')
      const playback = playClip(urlRef.current, speakerId)
      stopRef.current = playback.stop
      await playback.done
      setPhase('done')
    } catch {
      setPhase('failed')
    }
  }

  const busy = phase === 'recording' || phase === 'playing'
  return (
    <div className={styles.wrap}>
      <div className={styles.line}>
        <button type="button" className={styles.btn} onClick={busy ? undefined : run} aria-disabled={!stream || busy || undefined}>
          <Mic size={14} strokeWidth={2} aria-hidden="true" />
          {phase === 'recording' ? 'Merekam…' : phase === 'playing' ? 'Memutar…' : 'Rekam & putar ulang'}
        </button>
        {phase === 'recording' && <span className={styles.progress} style={{ animationDuration: `${CLIP_MS}ms` }} aria-hidden="true" />}
      </div>
      <p className={styles.note} role="status">
        {phase === 'recording' && 'Bicara sekarang selama 3 detik.'}
        {phase === 'playing' && 'Dengarkan suaramu.'}
        {phase === 'done' && 'Kalau suaramu terdengar jelas, mikrofon siap.'}
        {phase === 'failed' && 'Rekaman gagal. Coba lagi atau pilih mikrofon lain.'}
      </p>
    </div>
  )
}
