import type { Phase } from '../state/types'

export type EndPhase = Exclude<Phase, 'live'>

/** What happens to the recording once this person is gone, or null when nothing was being recorded. */
export function closingRecordingNote(phase: EndPhase, recording: boolean, othersInRoom: number): string | null {
  if (!recording) return null
  if (phase === 'ended') return 'Rekaman rapat ini tersimpan 24 jam di halaman Rekaman.'
  if (othersInRoom === 0) return 'Karena Anda yang terakhir, rekaman berhenti otomatis dan tersimpan 24 jam di halaman Rekaman.'
  return 'Rekaman masih berjalan selama masih ada peserta. Hasilnya tersimpan 24 jam di halaman Rekaman.'
}

/** "kurang dari 1 mnt", "42 mnt", "1 j", "2 j 5 mnt": how long this person was in the room. */
export function durationLabel(ms: number): string {
  const minutes = Math.floor(Math.max(0, ms) / 60_000)
  if (minutes < 1) return 'kurang dari 1 mnt'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${minutes} mnt`
  return rest ? `${hours} j ${rest} mnt` : `${hours} j`
}

export interface EndFacts {
  readonly hostName: string
  /** The person who ended the meeting for everyone is the host themself */
  readonly selfIsHost: boolean
  readonly othersInRoom: number
}

export interface EndCopy {
  readonly title: string
  readonly body: string
}

/** The words for each way a meeting can stop for someone. */
export function endCopy(phase: EndPhase, { hostName, selfIsHost, othersInRoom }: EndFacts): EndCopy {
  switch (phase) {
    case 'left':
      return {
        title: 'Anda keluar dari rapat',
        body: othersInRoom > 0 ? `Rapat masih berlangsung dengan ${othersInRoom} peserta. Anda bisa gabung lagi kapan saja.` : 'Ruangan kosong sekarang. Tautan rapat tetap bisa dipakai.',
      }
    case 'ended':
      return selfIsHost
        ? { title: 'Anda mengakhiri rapat untuk semua', body: 'Semua peserta sudah dikeluarkan. Tautan rapat tetap bisa dipakai bila Anda ingin membukanya lagi.' }
        : { title: 'Host mengakhiri rapat untuk semua', body: `${hostName} mengakhiri rapat ini. Tautan rapat tetap bisa dipakai bila host membukanya lagi.` }
    case 'removed':
      return { title: 'Host mengeluarkan Anda dari rapat', body: `Anda baru bisa masuk lagi bila ${hostName} mengizinkan. Hubungi ${hostName} bila ini keliru.` }
  }
}
