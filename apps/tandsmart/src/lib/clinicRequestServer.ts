import { createHash, randomBytes } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

// 32 random bytes → 43-char URL-safe token. Only its hash is stored.
export function newToken() {
  const token = randomBytes(32).toString('base64url')
  return { token, hash: hashToken(token) }
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export interface ActiveClinicRequest {
  id: string
  case_id: string
  clinic_name: string
  patient_name: string
  patient_personnummer: string
  requested_items: string[]
  period: string | null
  consent_text: string
  consented_at: string
  expires_at: string
  status: string
  uploaded_files: number
  bankid_verified_at: string | null
  bankid_name: string | null
  patient_id: string
}

// Resolves a clinic upload link. Returns null for unknown, revoked or
// expired links, and for cases that are already closed.
export async function findActiveClinicRequest(token: string): Promise<ActiveClinicRequest | null> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null
  const admin = createAdminClient()
  const { data } = await admin
    .from('clinic_requests')
    .select('id, case_id, clinic_name, patient_name, patient_personnummer, requested_items, period, consent_text, consented_at, expires_at, status, uploaded_files, bankid_verified_at, bankid_name, case:cases(patient_id, status)')
    .eq('token_hash', hashToken(token))
    .maybeSingle()
  if (!data) return null
  const c = data.case as unknown as { patient_id: string; status: string } | null
  if (!c || data.status === 'aterkallad' || new Date(data.expires_at) < new Date()) return null
  if (c.status === 'besvarat' || c.status === 'avslutat') return null
  const { case: _case, ...rest } = data
  return { ...(rest as Omit<ActiveClinicRequest, 'patient_id'>), patient_id: c.patient_id }
}

export function clinicFolder(r: ActiveClinicRequest) {
  return `${r.patient_id}/${r.case_id}`
}
