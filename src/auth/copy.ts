import { ALLOWED_DOMAINS } from './domains'
import type { EmailCheck } from './domains'

const DOMAIN_LIST = ALLOWED_DOMAINS.map((d) => `@${d}`)

/** "@dibimbing.id dan @cakrawala.ac.id" */
export const DOMAIN_SENTENCE = DOMAIN_LIST.join(' dan ')

export const DOMAIN_HINT = `Khusus akun ${DOMAIN_SENTENCE}.`

/** The field's error line for an address that did not pass. Names the problem and the way out. */
export function emailError(check: Exclude<EmailCheck, { ok: true }>): string {
  if (check.reason === 'empty') return 'Masukkan email Anda.'
  if (check.reason === 'format') return `Format email belum benar. Contoh: nama${DOMAIN_LIST[0]}`
  return `Email @${check.domain} tidak bisa dipakai. Gunakan akun ${DOMAIN_SENTENCE}.`
}

/** What shows when Google returns an account outside the allowed domains. */
export function ssoRejection(email: string): string {
  return `Akun ${email} tidak bisa dipakai. Gunakan akun ${DOMAIN_SENTENCE}.`
}
