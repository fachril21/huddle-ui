import { imageSources, resolveBackground } from './backgrounds'
import type { BackgroundChoice } from './backgrounds'
import { useBackgroundEffect } from './useBackgroundEffect'
import type { BackgroundEffect } from './useBackgroundEffect'
import { useCustomBackground } from './useCustomBackground'
import type { CustomBackground } from './useCustomBackground'

export interface Background extends BackgroundEffect {
  readonly custom: CustomBackground
  /** The choice as it can really be drawn (an upload that is gone counts as no effect) */
  readonly applied: BackgroundChoice
}

/** A camera stream with the chosen background applied, plus the upload that a picker needs. */
export function useBackground(stream: MediaStream | null, choice: BackgroundChoice): Background {
  const custom = useCustomBackground()
  // until the store has been read, an upload choice is kept as it is rather than dropped
  const applied = resolveBackground(choice, custom.url !== null || !custom.ready)
  const effect = useBackgroundEffect(stream, applied, imageSources(applied, custom.url))
  return { ...effect, custom, applied }
}
