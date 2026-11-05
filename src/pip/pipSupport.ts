/** Size of the mini window, close to Meet's (about 314 x 391) with room for a two-column roster. */
export const PIP_WIDTH = 340
export const PIP_HEIGHT = 440

/** The slice of the Document Picture-in-Picture API this app uses (Chrome and Edge 116+, desktop only). */
export interface DocumentPipApi {
  readonly window: Window | null
  requestWindow(options?: { width?: number; height?: number; disallowReturnToOpener?: boolean }): Promise<Window>
}

/** The browser's API, or null where it does not exist (Firefox, Safari, phones). */
export function getPipApi(host: object = globalThis): DocumentPipApi | null {
  const api = (host as { documentPictureInPicture?: DocumentPipApi }).documentPictureInPicture
  return api && typeof api.requestWindow === 'function' ? api : null
}

export function pipSupported(host: object = globalThis): boolean {
  return getPipApi(host) !== null
}
