import { INVITE_ORIGIN } from '../features/invite/inviteLink'

const CODE_RE = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:\/\//i
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'
const OWN_HOST = new URL(INVITE_ORIGIN).host

export function isMeetingCode(value: string): boolean {
  return CODE_RE.test(value)
}

/** New code shaped like Meet's: three, four, three letters. */
export function generateMeetingCode(random: () => number = Math.random): string {
  const pick = (n: number) => Array.from({ length: n }, () => LETTERS[Math.floor(random() * LETTERS.length)]).join('')
  return `${pick(3)}-${pick(4)}-${pick(3)}`
}

/** Six-digit passcode for the invitation. */
export function generatePasscode(random: () => number = Math.random): string {
  return Array.from({ length: 6 }, () => Math.floor(random() * 10)).join('')
}

export type JoinInput = { kind: 'ok'; code: string } | { kind: 'empty' } | { kind: 'format' } | { kind: 'foreign' }

/** Accepts a bare code, a code without dashes, or a pasted Huddle link. */
export function parseJoinInput(raw: string): JoinInput {
  const text = raw.trim()
  if (text === '') return { kind: 'empty' }

  let candidate = text
  if (SCHEME_RE.test(text) || text.includes('/')) {
    try {
      const url = new URL(SCHEME_RE.test(text) ? text : `https://${text}`)
      if (url.host.toLowerCase() !== OWN_HOST) return { kind: 'foreign' }
      candidate = url.pathname.split('/').filter(Boolean)[0] ?? ''
    } catch {
      return { kind: 'format' }
    }
  }

  const lower = candidate.toLowerCase()
  if (CODE_RE.test(lower)) return { kind: 'ok', code: lower }
  const bare = lower.replace(/[\s-]/g, '')
  if (/^[a-z]{10}$/.test(bare)) return { kind: 'ok', code: `${bare.slice(0, 3)}-${bare.slice(3, 7)}-${bare.slice(7)}` }
  return { kind: 'format' }
}
