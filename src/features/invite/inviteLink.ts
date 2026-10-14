export const INVITE_ORIGIN = 'https://huddle.dibimbing.id'

export function buildInviteUrl(code: string): string {
  return `${INVITE_ORIGIN}/${code}`
}

export function whatsappUrl(title: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`Gabung meeting "${title}": ${url}`)}`
}

export function mailtoUrl(title: string, url: string): string {
  return `mailto:?subject=${encodeURIComponent(`Undangan meeting: ${title}`)}&body=${encodeURIComponent(`Gabung lewat tautan ini:\n${url}`)}`
}
