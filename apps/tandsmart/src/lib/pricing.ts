// Price analysis for a dental cost estimate (prisförslag), measured against
// TLV's referenspriser and the statligt tandvårdsstöd rules for 2026:
//
// - Allmänt högkostnadsskydd: of the referenspris-based cost accumulated in a
//   12-month period, 50 % of the part between 3 000 and 15 000 kr and 85 % of
//   the part above 15 000 kr is reimbursed.
// - Särskild tandvårdsersättning för 67+ ("tiotandvården", from 2026-01-01):
//   the patient pays 10 % of the referenspris, the state the other 90 %.
// - The subsidy is always computed on min(clinic price, referenspris) — any
//   amount the clinic charges above the referenspris is paid in full by the
//   patient.
//
// These are estimates to help a patient read their prisförslag, not the
// clinic's or Försäkringskassan's binding calculation.

export const HKS_LOWER = 3000
export const HKS_UPPER = 15000
export const HKS_RATE_MIDDLE = 0.5
export const HKS_RATE_UPPER = 0.85
export const SENIOR_AGE = 67
export const SENIOR_STATE_SHARE = 0.9

// Above-reference thresholds for flagging a line. Clinics are free to price
// above the referenspris; these only mark where a patient should ask why.
export const ABOVE_REFERENCE_NOTICE = 1.1
export const ABOVE_REFERENCE_WARNING = 1.3

export interface QuoteItem {
  code: string | null
  description: string | null
  quantity: number
  unitPrice: number
}

export interface ReferencePrice {
  code: string
  description: string
  price_general: number | null
  price_specialist: number | null
}

export type LineFlag = 'ok' | 'under' | 'over' | 'hogt_over' | 'saknar_referens'

export interface LineAnalysis {
  item: QuoteItem
  reference: ReferencePrice | null
  referenceUnitPrice: number | null
  lineTotal: number
  // The part of lineTotal the state subsidy is computed on.
  subsidyBasis: number
  // lineTotal - subsidyBasis: always paid by the patient.
  aboveReference: number
  ratio: number | null
  flag: LineFlag
}

export interface QuoteAnalysis {
  lines: LineAnalysis[]
  total: number
  subsidyBasis: number
  aboveReferenceTotal: number
  estimatedSubsidy: number
  estimatedPatientCost: number
  scheme: 'hogkostnadsskydd' | 'tiotandvard'
  linesWithoutReference: number
}

export interface AnalysisOptions {
  isSpecialist?: boolean
  // Referenspris-based costs already accumulated in the current period.
  priorPeriodCosts?: number
  birthYear?: number | null
  year?: number
}

export function normalizeCode(code: string | null | undefined): string | null {
  const trimmed = (code ?? '').replace(/\s+/g, '')
  return trimmed ? trimmed : null
}

function round(n: number) {
  return Math.round(n * 100) / 100
}

export function isSeniorPatient(birthYear: number | null | undefined, year: number) {
  return typeof birthYear === 'number' && year - birthYear >= SENIOR_AGE
}

// State reimbursement under allmänt högkostnadsskydd for `basis` kr of new
// referenspris-based cost, when `prior` kr has already accumulated this period.
export function highCostProtectionSubsidy(basis: number, prior = 0): number {
  if (basis <= 0) return 0
  const start = Math.max(0, prior)
  const end = start + basis
  const middle = Math.max(0, Math.min(end, HKS_UPPER) - Math.max(start, HKS_LOWER))
  const upper = Math.max(0, end - Math.max(start, HKS_UPPER))
  return round(middle * HKS_RATE_MIDDLE + upper * HKS_RATE_UPPER)
}

export function analyzeLine(
  item: QuoteItem,
  references: Map<string, ReferencePrice>,
  isSpecialist = false,
): LineAnalysis {
  const code = normalizeCode(item.code)
  const reference = code ? references.get(code) ?? null : null
  const referenceUnitPrice = reference
    ? (isSpecialist ? reference.price_specialist ?? reference.price_general : reference.price_general)
    : null
  const lineTotal = round(item.unitPrice * item.quantity)

  if (referenceUnitPrice == null || referenceUnitPrice <= 0) {
    return {
      item, reference, referenceUnitPrice: null, lineTotal,
      // Without a referenspris we can't know what counts toward the subsidy,
      // so assume the full price does — the estimate stays optimistic and the
      // line is flagged for the patient to check.
      subsidyBasis: lineTotal, aboveReference: 0, ratio: null, flag: 'saknar_referens',
    }
  }

  const referenceTotal = referenceUnitPrice * item.quantity
  const subsidyBasis = round(Math.min(lineTotal, referenceTotal))
  const ratio = item.unitPrice / referenceUnitPrice
  const flag: LineFlag =
    ratio >= ABOVE_REFERENCE_WARNING ? 'hogt_over'
    : ratio >= ABOVE_REFERENCE_NOTICE ? 'over'
    : ratio < 0.9 ? 'under'
    : 'ok'

  return {
    item, reference, referenceUnitPrice, lineTotal, subsidyBasis,
    aboveReference: round(lineTotal - subsidyBasis), ratio, flag,
  }
}

export function analyzeQuote(
  items: QuoteItem[],
  referenceList: ReferencePrice[],
  options: AnalysisOptions = {},
): QuoteAnalysis {
  const references = new Map(referenceList.map(r => [r.code, r]))
  const year = options.year ?? new Date().getFullYear()
  const lines = items.map(item => analyzeLine(item, references, options.isSpecialist))

  const total = round(lines.reduce((sum, l) => sum + l.lineTotal, 0))
  const subsidyBasis = round(lines.reduce((sum, l) => sum + l.subsidyBasis, 0))
  const aboveReferenceTotal = round(lines.reduce((sum, l) => sum + l.aboveReference, 0))

  const senior = isSeniorPatient(options.birthYear, year)
  const estimatedSubsidy = senior
    ? round(subsidyBasis * SENIOR_STATE_SHARE)
    : highCostProtectionSubsidy(subsidyBasis, options.priorPeriodCosts ?? 0)

  return {
    lines,
    total,
    subsidyBasis,
    aboveReferenceTotal,
    estimatedSubsidy,
    estimatedPatientCost: round(total - estimatedSubsidy),
    scheme: senior ? 'tiotandvard' : 'hogkostnadsskydd',
    linesWithoutReference: lines.filter(l => l.flag === 'saknar_referens').length,
  }
}

export function formatKr(amount: number): string {
  return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(Math.round(amount))} kr`
}
