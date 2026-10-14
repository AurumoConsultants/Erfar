import { describe, expect, it } from 'vitest'
import { buildConsentText, formatPersonnummerInput, normalizePersonnummer } from './clinicRequest'
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

describe('formatPersonnummerInput', () => {
  it('inserts the dash in the twelve-digit form', () => {
    expect(formatPersonnummerInput('197301315078')).toBe('19730131-5078')
    expect(formatPersonnummerInput('19730131')).toBe('19730131')
    expect(formatPersonnummerInput('197301315')).toBe('19730131-5')
  })
  it('inserts the dash in the ten-digit form', () => {
    expect(formatPersonnummerInput('7301315078')).toBe('730131-5078')
    expect(formatPersonnummerInput('730131')).toBe('730131')
  })
  it('keeps an existing dash in place and drops extra digits', () => {
    expect(formatPersonnummerInput('19730131-5078')).toBe('19730131-5078')
    expect(formatPersonnummerInput('1973013150789')).toBe('19730131-5078')
  })
  it('keeps the plus sign for people 100 or older', () => {
    expect(formatPersonnummerInput('201231+1234')).toBe('201231+1234')
  })
})
