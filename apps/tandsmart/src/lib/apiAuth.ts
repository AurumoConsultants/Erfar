import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dentistHasBankId } from '@/lib/auth'

// For API routes: returns the dentist's id, or a ready-made error response.
export async function dentistOrError(): Promise<{ id: string } | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ej inloggad.' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'tandlakare') return NextResponse.json({ error: 'Endast för granskande tandläkare.' }, { status: 403 })
  if (!(await dentistHasBankId(user.id))) return NextResponse.json({ error: 'Logga in med BankID.' }, { status: 401 })
  return { id: user.id }
}
