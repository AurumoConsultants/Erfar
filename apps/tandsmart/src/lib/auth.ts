import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

export async function requireDentist(): Promise<Profile> {
  const profile = await requireProfile()
  if (profile.role !== 'tandlakare') redirect('/arenden')
  return profile
}
