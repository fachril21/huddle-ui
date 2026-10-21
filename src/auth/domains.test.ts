import { describe, expect, it } from 'vitest'
import { ALLOWED_DOMAINS, completeEmail, validateEmail } from './domains'

describe('validateEmail', () => {
  it('accepts the two company domains and returns the normalized address', () => {
    expect(validateEmail('dewi@dibimbing.id')).toEqual({ ok: true, email: 'dewi@dibimbing.id' })
    expect(validateEmail('raka.p@cakrawala.ac.id')).toEqual({ ok: true, email: 'raka.p@cakrawala.ac.id' })
  })

  it('trims spaces and ignores case', () => {
    expect(validateEmail('  Dewi.Lestari@DIBIMBING.ID ')).toEqual({ ok: true, email: 'dewi.lestari@dibimbing.id' })
  })

  it('accepts plus tags and digits in the name part', () => {
    expect(validateEmail('dewi+huddle2@dibimbing.id').ok).toBe(true)
  })

  it('reports an empty field on its own', () => {
    expect(validateEmail('')).toEqual({ ok: false, reason: 'empty' })
    expect(validateEmail('   ')).toEqual({ ok: false, reason: 'empty' })
  })

  it('reports a malformed address as a format problem', () => {
    for (const bad of ['dewi', 'dewi@', '@dibimbing.id', 'dewi dibimbing.id', 'de wi@dibimbing.id', 'a@b@dibimbing.id', 'dewi@dibimbing.id@evil.com']) {
      expect(validateEmail(bad), bad).toEqual({ ok: false, reason: 'format' })
    }
  })

  it('rejects any other domain and names it', () => {
    expect(validateEmail('dewi@gmail.com')).toEqual({ ok: false, reason: 'domain', domain: 'gmail.com' })
  })

  it('rejects look-alikes and subdomains of the allowed domains', () => {
    for (const bad of ['a@dibimbing.id.evil.com', 'a@mail.dibimbing.id', 'a@xdibimbing.id', 'a@dibimbing.com', 'a@cakrawala.ac.id.', 'a@evil-cakrawala.ac.id']) {
      expect(validateEmail(bad).ok, bad).toBe(false)
    }
  })

  it('lists exactly the two domains', () => {
    expect([...ALLOWED_DOMAINS]).toEqual(['dibimbing.id', 'cakrawala.ac.id'])
  })
})

describe('completeEmail', () => {
  it('adds the chosen domain to a bare name', () => {
    expect(completeEmail('dewi', 'dibimbing.id')).toBe('dewi@dibimbing.id')
  })

  it('swaps the domain when one was already typed', () => {
    expect(completeEmail('dewi@gmail.com', 'cakrawala.ac.id')).toBe('dewi@cakrawala.ac.id')
    expect(completeEmail('dewi@', 'dibimbing.id')).toBe('dewi@dibimbing.id')
  })

  it('returns null when there is no name to attach the domain to', () => {
    expect(completeEmail('', 'dibimbing.id')).toBeNull()
    expect(completeEmail('  ', 'dibimbing.id')).toBeNull()
    expect(completeEmail('@gmail.com', 'dibimbing.id')).toBeNull()
  })
})
