const PALETTES = ['borealis', 'nebula', 'solstice', 'abyss', 'orchid', 'verdant'] as const
export type PaletteName = (typeof PALETTES)[number]

/** Same person, same colors every time: a stable hash of the label, like participant palettes in the room. */
export function paletteFor(label: string): PaletteName {
  let sum = 0
  for (const ch of label.toLowerCase()) sum = (sum * 31 + ch.charCodeAt(0)) % 9973
  return PALETTES[sum % PALETTES.length]
}

/** "dewi.lestari@huddle.id" -> "Dewi Lestari". Falls back to the raw text. */
export function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? ''
  const words = local.split(/[._-]+/).filter(Boolean)
  if (words.length === 0) return email
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function initialOf(label: string): string {
  return label.trim().charAt(0).toUpperCase() || '?'
}
