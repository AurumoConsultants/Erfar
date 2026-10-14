import { describe, expect, it } from 'vitest'
import { analyzeQuote, highCostProtectionSubsidy, normalizeCode, type ReferencePrice } from './pricing'

const refs: ReferencePrice[] = [
  { code: '101', description: 'Basundersökning', price_general: 1100, price_specialist: 1100 },
  { code: '401', description: 'Tanduttagning, en tand', price_general: 1280, price_specialist: 1670 },
  { code: '800', description: 'Permanent tandstödd krona', price_general: 6825, price_specialist: null },
]

describe('highCostProtectionSubsidy', () => {
  it('pays nothing below the 3 000 kr threshold', () => {
    expect(highCostProtectionSubsidy(2500)).toBe(0)
  })

  it('pays 50 % between 3 000 and 15 000 kr', () => {
    expect(highCostProtectionSubsidy(5000)).toBe(1000)
  })

  it('pays 85 % above 15 000 kr', () => {
    // 12 000 * 0.5 + 5 000 * 0.85
    expect(highCostProtectionSubsidy(20000)).toBe(10250)
  })

  it('continues from costs already accumulated in the period', () => {
    // prior 14 000: 1 000 kr at 50 %, 1 000 kr at 85 %
    expect(highCostProtectionSubsidy(2000, 14000)).toBe(1350)
  })
})

describe('analyzeQuote', () => {
  it('computes the subsidy on the referenspris when the clinic charges more', () => {
    const analysis = analyzeQuote(
      [{ code: '800', description: 'Krona', quantity: 1, unitPrice: 9000 }],
      refs,
      { year: 2026, birthYear: 1980 },
    )
    const [line] = analysis.lines
    expect(line.subsidyBasis).toBe(6825)
    expect(line.aboveReference).toBe(2175)
    expect(line.flag).toBe('hogt_over')
    // 3 825 kr of the basis falls in the 50 % step
    expect(analysis.estimatedSubsidy).toBe(1912.5)
    expect(analysis.estimatedPatientCost).toBe(7087.5)
  })

  it('applies tiotandvården for patients 67 or older', () => {
    const analysis = analyzeQuote(
      [{ code: '101', description: null, quantity: 1, unitPrice: 1100 }],
      refs,
      { year: 2026, birthYear: 1959 },
    )
    expect(analysis.scheme).toBe('tiotandvard')
    expect(analysis.estimatedSubsidy).toBe(990)
    expect(analysis.estimatedPatientCost).toBe(110)
  })

  it('uses the specialist referenspris for specialist clinics', () => {
    const analysis = analyzeQuote(
      [{ code: '401', description: null, quantity: 2, unitPrice: 1670 }],
      refs,
      { isSpecialist: true, year: 2026 },
    )
    expect(analysis.lines[0].referenceUnitPrice).toBe(1670)
    expect(analysis.lines[0].flag).toBe('ok')
  })

  it('flags codes without a referenspris', () => {
    const analysis = analyzeQuote(
      [{ code: '9 99', description: 'Okänd', quantity: 1, unitPrice: 500 }],
      refs,
    )
    expect(analysis.lines[0].flag).toBe('saknar_referens')
    expect(analysis.linesWithoutReference).toBe(1)
  })
})

describe('normalizeCode', () => {
  it('strips whitespace and treats blanks as missing', () => {
    expect(normalizeCode(' 8 00 ')).toBe('800')
    expect(normalizeCode('  ')).toBeNull()
  })
})
