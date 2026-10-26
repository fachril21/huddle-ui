/** How strongly the background is blurred. */
export type BlurLevel = 1 | 2 | 3

/** What sits behind the person: nothing, a blurred copy of the room, or a picture. */
export type BackgroundChoice =
  | { readonly mode: 'none' }
  | { readonly mode: 'blur'; readonly level: BlurLevel }
  | { readonly mode: 'image'; readonly id: string }

export const NO_BACKGROUND: BackgroundChoice = { mode: 'none' }
export const DEFAULT_BLUR_LEVEL: BlurLevel = 2

/** The picture the person uploaded themselves. Only one is kept. */
export const CUSTOM_BACKGROUND_ID = 'custom'

export interface BlurOption {
  readonly id: BlurLevel
  readonly label: string
  /** Blur radius as a share of the frame height, so it looks the same at 360p and 1080p */
  readonly share: number
}

export const BLUR_LEVELS: readonly BlurOption[] = [
  { id: 1, label: 'Ringan', share: 0.012 },
  { id: 2, label: 'Sedang', share: 0.026 },
  { id: 3, label: 'Kuat', share: 0.045 },
]

export interface BackgroundImage {
  readonly id: string
  readonly label: string
  /** Tried in order; the first that loads wins */
  readonly sources: readonly string[]
  /** Two colours shown while (or instead of) the picture loads */
  readonly tint: readonly [string, string]
}

const BASE = import.meta.env?.BASE_URL ?? '/'
const path = (name: string): readonly string[] => [`${BASE}backgrounds/${name}.webp`]

export const BACKGROUND_IMAGES: readonly BackgroundImage[] = [
  { id: 'kantor', label: 'Kantor', sources: path('kantor'), tint: ['#cfd8dc', '#7fa6a8'] },
  { id: 'ruang-kelas', label: 'Ruang kelas', sources: path('ruang-kelas'), tint: ['#e4e0d4', '#8d8fc4'] },
  { id: 'rak-buku', label: 'Rak buku', sources: path('rak-buku'), tint: ['#c9a36b', '#4a3524'] },
  { id: 'kafe', label: 'Kafe', sources: path('kafe'), tint: ['#e3c9a3', '#7a5a43'] },
  { id: 'aurora', label: 'Aurora', sources: path('aurora'), tint: ['#0b1020', '#2a8f9a'] },
]

const IMAGE_BY_ID = new Map(BACKGROUND_IMAGES.map((image) => [image.id, image]))

export function backgroundImage(id: string): BackgroundImage | undefined {
  return IMAGE_BY_ID.get(id)
}

function isBlurLevel(value: unknown): value is BlurLevel {
  return value === 1 || value === 2 || value === 3
}

/** Stored or untrusted JSON back to a choice. Anything unrecognised means no effect. */
export function parseBackground(value: unknown): BackgroundChoice {
  if (typeof value !== 'object' || value === null) return NO_BACKGROUND
  const v = value as Record<string, unknown>
  if (v.mode === 'blur') return { mode: 'blur', level: isBlurLevel(v.level) ? v.level : DEFAULT_BLUR_LEVEL }
  if (v.mode === 'image' && typeof v.id === 'string' && (v.id === CUSTOM_BACKGROUND_ID || IMAGE_BY_ID.has(v.id))) return { mode: 'image', id: v.id }
  return NO_BACKGROUND
}

/** A choice that can actually be drawn: a missing upload or an unknown picture falls back to no effect. */
export function resolveBackground(choice: BackgroundChoice, hasCustom: boolean): BackgroundChoice {
  if (choice.mode !== 'image') return choice
  if (choice.id === CUSTOM_BACKGROUND_ID) return hasCustom ? choice : NO_BACKGROUND
  return IMAGE_BY_ID.has(choice.id) ? choice : NO_BACKGROUND
}

export function isEffectOn(choice: BackgroundChoice): boolean {
  return choice.mode !== 'none'
}

export function sameBackground(a: BackgroundChoice, b: BackgroundChoice): boolean {
  if (a.mode !== b.mode) return false
  if (a.mode === 'blur' && b.mode === 'blur') return a.level === b.level
  if (a.mode === 'image' && b.mode === 'image') return a.id === b.id
  return true
}

/** Stable text for effect dependencies, so a new object with the same meaning does not restart the effect. */
export function backgroundKey(choice: BackgroundChoice): string {
  if (choice.mode === 'blur') return `blur:${choice.level}`
  if (choice.mode === 'image') return `image:${choice.id}`
  return 'none'
}

export function blurRadius(level: BlurLevel, frameHeight: number): number {
  const option = BLUR_LEVELS.find((o) => o.id === level) ?? BLUR_LEVELS[1]
  return Math.round(frameHeight * option.share * 10) / 10
}

/** Where to find the picture for an image choice. The upload is an object URL that only the caller knows. */
export function imageSources(choice: BackgroundChoice, customUrl: string | null): readonly string[] {
  if (choice.mode !== 'image') return []
  if (choice.id === CUSTOM_BACKGROUND_ID) return customUrl ? [customUrl] : []
  return IMAGE_BY_ID.get(choice.id)?.sources ?? []
}

/** Short words for the choice, for summaries and screen readers. */
export function describeBackground(choice: BackgroundChoice): string {
  if (choice.mode === 'blur') return `Blur ${(BLUR_LEVELS.find((o) => o.id === choice.level) ?? BLUR_LEVELS[1]).label.toLowerCase()}`
  if (choice.mode === 'image') return choice.id === CUSTOM_BACKGROUND_ID ? 'Gambar saya' : (IMAGE_BY_ID.get(choice.id)?.label ?? 'Tanpa efek')
  return 'Tanpa efek'
}
