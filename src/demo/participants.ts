import type { Participant } from '../state/types'

/** Mock participants, PRD 11.1. Initial camera/mic state only; the reducer owns changes. */
export const ALL_PARTICIPANTS: readonly Participant[] = [
  { id: 'anda', name: 'Anda', role: 'Host', palette: 'borealis', camOn: true, micOn: true },
  { id: 'dewi', name: 'Dewi', role: 'Co-host', palette: 'nebula', camOn: false, micOn: true },
  { id: 'raka', name: 'Raka', role: 'Peserta', palette: 'abyss', camOn: false, micOn: true },
  { id: 'bima', name: 'Bima', role: 'Peserta', palette: 'solstice', camOn: true, micOn: true },
  { id: 'sari', name: 'Sari', role: 'Peserta', palette: 'verdant', camOn: true, micOn: true },
  { id: 'maya', name: 'Maya', role: 'Peserta', palette: 'orchid', camOn: false, micOn: true },
  { id: 'fajar', name: 'Fajar', role: 'Peserta', palette: 'borealis', camOn: true, micOn: true },
  { id: 'andi', name: 'Andi', role: 'Tamu', palette: 'nebula', camOn: false, micOn: true },
  { id: 'laras', name: 'Laras', role: 'Peserta', palette: 'abyss', camOn: true, micOn: true },
  { id: 'yoga', name: 'Yoga', role: 'Peserta', palette: 'solstice', camOn: false, micOn: true },
  { id: 'citra', name: 'Citra', role: 'Peserta', palette: 'verdant', camOn: true, micOn: true },
  { id: 'hendra', name: 'Hendra', role: 'Peserta', palette: 'orchid', camOn: false, micOn: true },
]

/** M1/M2 show the first 8; the 4/8/12 selector arrives in M7/M8. */
export const VISIBLE_COUNT = 8
