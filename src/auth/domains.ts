/** Only accounts on these two domains may sign in, by Google or by email code. Matched exactly: subdomains and look-alikes are out. */
export const ALLOWED_DOMAINS = ['dibimbing.id', 'cakrawala.ac.id'] as const

export type EmailCheck =
  | { readonly ok: true; readonly email: string }
  | { readonly ok: false; readonly reason: 'empty' }
  | { readonly ok: false; readonly reason: 'format' }
  | { readonly ok: false; readonly reason: 'domain'; readonly domain: string }

/** One "@", a name part without spaces, and a dotted domain. Deliberately plain: the mail server is the real judge of an address. */
const SHAPE_RE = /^([a-z0-9._%+-]+)@([a-z0-9-]+(?:\.[a-z0-9-]+)+)$/

export function isAllowedDomain(domain: string): boolean {
  return (ALLOWED_DOMAINS as readonly string[]).includes(domain.toLowerCase())
}

/**
 * Prototype-side check. It shapes the form and its messages; it is not a security control.
 * The server must run the same domain check on the verified identity (Google's `hd` claim is only a hint).
 */
export function validateEmail(raw: string): EmailCheck {
  const text = raw.trim().toLowerCase()
  if (text === '') return { ok: false, reason: 'empty' }

  const match = SHAPE_RE.exec(text)
  if (!match) return { ok: false, reason: 'format' }

  const domain = match[2]
  if (!isAllowedDomain(domain)) return { ok: false, reason: 'domain', domain }
  return { ok: true, email: text }
}

/** "dewi" or "dewi@gm" plus a chosen domain -> "dewi@dibimbing.id". Null when there is no name to attach it to. */
export function completeEmail(raw: string, domain: string): string | null {
  const name = raw.trim().split('@')[0] ?? ''
  if (name === '') return null
  return `${name}@${domain}`
}
