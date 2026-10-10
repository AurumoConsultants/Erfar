import { describe, expect, it } from 'vitest'
import { buildConsentText, normalizePersonnummer } from './clinicRequest'
import { hashToken, newToken } from './clinicRequestServer'

const now = new Date('2026-10-10')

describe('normalizePersonnummer', () => {
  it('accepts 12 and 10 digit forms with a valid check digit', () => {
    expect(normalizePersonnummer('19811218-9876', now)).toBe('19811218-9876')
    expect(normalizePersonnummer('811218-9876', now)).toBe('19811218-9876')
    expect(normalizePersonnummer('198112189876', now)).toBe('19811218-9876')
  })

  it('picks the century from the current year and honours "+"', () => {
    expect(normalizePersonnummer('121212-1212', now)).toBe('20121212-1212')
    expect(normalizePersonnummer('121212+1212', now)).toBe('19121212-1212')
  })

  it('rejects a wrong check digit or malformed input', () => {
    expect(normalizePersonnummer('19811218-9875', now)).toBeNull()
    expect(normalizePersonnummer('12345', now)).toBeNull()
    expect(normalizePersonnummer('19811318-9876', now)).toBeNull()
  })
})

describe('tokens', () => {
  it('generates long URL-safe tokens and stores only a stable hash', () => {
    const { token, hash } = newToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(hash).toBe(hashToken(token))
    expect(hash).not.toContain(token)
  })
})

describe('buildConsentText', () => {
  it('names the patient, clinic, items and period', () => {
    const text = buildConsentText({
      patientName: 'Anna Andersson', personnummer: '19811218-9876', clinicName: 'Happident',
      items: ['journal', 'rontgen'], period: '2025–2026',
    })
    expect(text).toContain('Anna Andersson (19811218-9876)')
    expect(text).toContain('Happident lämnar ut kopior av journalanteckningar, röntgenbilder för perioden 2025–2026')
  })
})
