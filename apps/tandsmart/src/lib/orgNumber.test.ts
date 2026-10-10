import { describe, expect, it } from 'vitest'
import { formatOrgNumberInput, normalizeOrgNumber } from './orgNumber'

describe('formatOrgNumberInput', () => {
  it('adds the dash after six digits', () => {
    expect(formatOrgNumberInput('5567573612')).toBe('556757-3612')
    expect(formatOrgNumberInput('5567573')).toBe('556757-3')
  })

  it('leaves partial input without a dash', () => {
    expect(formatOrgNumberInput('556757')).toBe('556757')
  })

  it('keeps an already dashed number and drops other characters', () => {
    expect(formatOrgNumberInput('556757-3612')).toBe('556757-3612')
    expect(formatOrgNumberInput(' 556 757 3612 ')).toBe('556757-3612')
  })

  it('strips a century prefix and caps at ten digits', () => {
    expect(formatOrgNumberInput('165567573612')).toBe('556757-3612')
    expect(formatOrgNumberInput('55675736129')).toBe('556757-3612')
  })
})

describe('normalizeOrgNumber', () => {
  it('returns the dashed form only for complete numbers', () => {
    expect(normalizeOrgNumber('5567573612')).toBe('556757-3612')
    expect(normalizeOrgNumber('556757-36')).toBeNull()
    expect(normalizeOrgNumber(null)).toBeNull()
  })
})
