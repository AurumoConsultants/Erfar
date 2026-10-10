import { createClient } from '@/lib/supabase/server'
import { analyzeQuote, type QuoteAnalysis, type ReferencePrice } from '@/lib/pricing'
import { normalizeOrgNumber } from '@/lib/orgNumber'
import type { CaseFileKind, CaseService, CaseStatus, CaseVerdict, ClinicRating } from '@/lib/cases'

export interface CaseRow {
  id: string
  patient_id: string
  services: CaseService[]
  status: CaseStatus
  title: string
  patient_description: string | null
  patient_questions: string | null
  clinic_name: string | null
  clinic_org_number: string | null
  clinic_city: string | null
  treating_dentist: string | null
  is_specialist: boolean
  prior_period_costs: number
  ai_draft: unknown
  ai_draft_at: string | null
  review_verdict: CaseVerdict | null
  review_summary: string | null
  review_price: string | null
  review_plan: string | null
  review_clinic: string | null
  review_questions: string | null
  answered_at: string | null
  info_request: string | null
  info_requested_at: string | null
  info_answered_at: string | null
  created_at: string
}

export interface CaseItemRow {
  id: string
  code: string | null
  description: string | null
  tooth: string | null
  quantity: number
  unit_price: number
}

export interface CaseFileRow {
  id: string
  path: string
  file_name: string
  mime_type: string
  kind: CaseFileKind
  signedUrl: string | null
}

export interface CaseMessageRow {
  id: string
  author_id: string
  body: string
  created_at: string
  author: { full_name: string; role: string } | null
}

export interface ClinicReviewRow {
  org_number: string
  name: string
  finance_rating: ClinicRating
  finance_note: string | null
  ivo_rating: ClinicRating
  ivo_note: string | null
  reputation_rating: ClinicRating
  reputation_note: string | null
  reviewed_at: string
}

export interface CaseBundle {
  case: CaseRow
  patient: { full_name: string; email: string; birth_year: number | null } | null
  items: CaseItemRow[]
  files: CaseFileRow[]
  messages: CaseMessageRow[]
  clinicReview: ClinicReviewRow | null
  references: ReferencePrice[]
  analysis: QuoteAnalysis
}

// Loads everything a case page needs, under the caller's own RLS — a
// patient only ever gets their own case, the dentist any case. Each load
// is appended to case_access_log.
export async function loadCase(caseId: string, viewerId: string): Promise<CaseBundle | null> {
  const supabase = await createClient()
  const { data: caseRow } = await supabase.from('cases').select('*').eq('id', caseId).maybeSingle()
  if (!caseRow) return null
  const c = caseRow as CaseRow

  const orgNumber = normalizeOrgNumber(c.clinic_org_number)
  const [patientRes, itemsRes, filesRes, messagesRes, clinicRes, refsRes] = await Promise.all([
    supabase.from('profiles').select('full_name, email, birth_year').eq('id', c.patient_id).maybeSingle(),
    supabase.from('case_items').select('id, code, description, tooth, quantity, unit_price').eq('case_id', caseId).order('sort'),
    supabase.from('case_files').select('id, path, file_name, mime_type, kind').eq('case_id', caseId).order('created_at'),
    supabase.from('case_messages').select('id, author_id, body, created_at, author:profiles(full_name, role)').eq('case_id', caseId).order('created_at'),
    orgNumber
      ? supabase.from('clinic_reviews').select('*').eq('org_number', orgNumber).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('reference_prices').select('code, description, price_general, price_specialist').order('code'),
    supabase.from('case_access_log').insert({ case_id: caseId, profile_id: viewerId, action: 'view' }),
  ])

  const fileRows = (filesRes.data ?? []) as Omit<CaseFileRow, 'signedUrl'>[]
  const signed = fileRows.length
    ? await supabase.storage.from('case-files').createSignedUrls(fileRows.map(f => f.path), 60 * 10)
    : { data: [] }
  const files = fileRows.map((f, i) => ({ ...f, signedUrl: signed.data?.[i]?.signedUrl ?? null }))

  const items = ((itemsRes.data ?? []) as CaseItemRow[]).map(i => ({ ...i, unit_price: Number(i.unit_price) }))
  const references = (refsRes.data ?? []) as ReferencePrice[]
  const patient = patientRes.data as CaseBundle['patient']

  const analysis = analyzeQuote(
    items.map(i => ({ code: i.code, description: i.description, quantity: i.quantity, unitPrice: i.unit_price })),
    references,
    { isSpecialist: c.is_specialist, priorPeriodCosts: Number(c.prior_period_costs), birthYear: patient?.birth_year ?? null },
  )

  return {
    case: c,
    patient,
    items,
    files,
    messages: (messagesRes.data ?? []) as unknown as CaseMessageRow[],
    clinicReview: clinicRes.data as ClinicReviewRow | null,
    references,
    analysis,
  }
}
