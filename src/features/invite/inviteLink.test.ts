import { describe, expect, it } from 'vitest'
import { buildInviteUrl, mailtoUrl, whatsappUrl } from './inviteLink'

describe('invite links', () => {
  it('builds the meeting url from the code', () => {
    expect(buildInviteUrl('abc-defg-hij')).toBe('https://huddle.dibimbing.id/abc-defg-hij')
  })

  it('encodes the title and url in the WhatsApp message', () => {
    const link = whatsappUrl('Brainstorm sprint', 'https://huddle.dibimbing.id/abc-defg-hij')
    expect(link.startsWith('https://wa.me/?text=')).toBe(true)
    expect(decodeURIComponent(link.split('text=')[1])).toBe('Gabung meeting "Brainstorm sprint": https://huddle.dibimbing.id/abc-defg-hij')
  })

  it('puts the subject and body in the mailto link', () => {
    const link = mailtoUrl('Rapat & rencana', 'https://huddle.dibimbing.id/abc-defg-hij')
    const [, query] = link.split('?')
    const params = new URLSearchParams(query)
    expect(params.get('subject')).toBe('Undangan meeting: Rapat & rencana')
    expect(params.get('body')).toContain('https://huddle.dibimbing.id/abc-defg-hij')
  })
})
