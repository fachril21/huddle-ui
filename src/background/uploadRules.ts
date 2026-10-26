export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
/** Uploads are shrunk to this width; a background never needs more than a 1080p frame */
export const MAX_UPLOAD_WIDTH = 1920

export const ACCEPTED_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp']

export type UploadProblem = 'type' | 'size' | 'unreadable'

export const UPLOAD_PROBLEM_COPY: Record<UploadProblem, string> = {
  type: 'Format tidak didukung. Pakai JPG, PNG, atau WebP.',
  size: 'Berkas terlalu besar. Maksimal 5 MB.',
  unreadable: 'Gambar tidak bisa dibuka. Coba berkas lain.',
}

/** First reason a file cannot be used, judged only by what the browser tells us before reading it. */
export function checkUpload(file: { readonly type: string; readonly size: number }): UploadProblem | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'type'
  if (file.size > MAX_UPLOAD_BYTES) return 'size'
  if (file.size === 0) return 'unreadable'
  return null
}

/** Size after shrinking to fit the width limit, never enlarging. */
export function fitWidth(width: number, height: number, maxWidth: number = MAX_UPLOAD_WIDTH): { width: number; height: number } {
  if (width <= maxWidth) return { width, height }
  const scale = maxWidth / width
  return { width: maxWidth, height: Math.max(1, Math.round(height * scale)) }
}

/** Largest rectangle with the target's proportions that fits inside the source, centred (CSS `object-fit: cover`). */
export function coverRect(srcW: number, srcH: number, dstW: number, dstH: number): { sx: number; sy: number; sw: number; sh: number } {
  const srcRatio = srcW / srcH
  const dstRatio = dstW / dstH
  if (srcRatio > dstRatio) {
    const sw = srcH * dstRatio
    return { sx: (srcW - sw) / 2, sy: 0, sw, sh: srcH }
  }
  const sh = srcW / dstRatio
  return { sx: 0, sy: (srcH - sh) / 2, sw: srcW, sh }
}
