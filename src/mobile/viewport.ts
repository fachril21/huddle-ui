/**
 * Size classes. CSS cannot read these constants, so the same numbers are repeated in media queries:
 *   phone              @media (max-width: 767px)
 *   short landscape    @media (max-height: 500px) and (pointer: coarse)
 *   touch              @media (pointer: coarse)
 * Change them here and in every module that mirrors them (grep "767px").
 */
export const PHONE_MAX_WIDTH = 767
export const TABLET_MAX_WIDTH = 1099
export const SHORT_MAX_HEIGHT = 500

export type SizeClass = 'phone' | 'tablet' | 'desktop'

export interface ViewportInfo {
  readonly width: number
  readonly height: number
  readonly sizeClass: SizeClass
  readonly landscape: boolean
  /** Touch is the primary input: finger-sized targets, no hover */
  readonly coarse: boolean
  /** Landscape on a phone: wide, but very little height */
  readonly shortHeight: boolean
}

/**
 * A phone held sideways is wider than 767px but has the height of a phone, so it counts as a tablet-class layout
 * with short-height rules (slim controls, side panels). A desktop window that is merely short is not affected.
 */
export function classifyViewport(width: number, height: number, coarse: boolean): ViewportInfo {
  const landscape = width > height
  const shortHeight = coarse && landscape && height <= SHORT_MAX_HEIGHT
  const sizeClass: SizeClass = width <= PHONE_MAX_WIDTH ? 'phone' : shortHeight || width <= TABLET_MAX_WIDTH ? 'tablet' : 'desktop'
  return { width, height, sizeClass, landscape, coarse, shortHeight }
}

/** Pixels the on-screen keyboard (or any browser UI) takes from the bottom of the visual viewport. */
export function keyboardInset(layoutHeight: number, visualHeight: number, visualOffsetTop: number): number {
  const inset = Math.round(layoutHeight - visualHeight - visualOffsetTop)
  // small differences are browser chrome sliding in and out, not a keyboard
  return inset > 80 ? inset : 0
}

/** Pointer travel after which a drag on a sheet closes it, or the speed (px per ms) of a quick flick. */
export const SHEET_CLOSE_DISTANCE = 110
export const SHEET_CLOSE_VELOCITY = 0.6

export function shouldCloseSheet(distance: number, velocity: number): boolean {
  return distance >= SHEET_CLOSE_DISTANCE || (distance > 24 && velocity >= SHEET_CLOSE_VELOCITY)
}
