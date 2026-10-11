import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BANKID_COOKIE, bankIdConfigured, verifyBankIdSession } from '@/lib/bankid'

export interface Profile {
  id: string
  full_name: string
  email: string
  phone: string | null
  birth_year: number | null
  role: 'patient' | 'tandlakare'
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('id, full_name, email, phone, birth_year, role').eq('id', user.id).single()
  return data as Profile | null
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  return profile
}

// Dentists read health data, so they need a BankID login on top of their
// password (stark autentisering). The database enforces the same rule.
export async function dentistHasBankId(userId: string) {
  if (!bankIdConfigured()) return true
  return verifyBankIdSession((await cookies()).get(BANKID_COOKIE)?.value, userId)
}

export async function requireDentist(): Promise<Profile> {
  const profile = await requireProfile()
  if (profile.role !== 'tandlakare') redirect('/arenden')
  if (!(await dentistHasBankId(profile.id))) redirect('/auth/tandlakare')
  return profile
}
