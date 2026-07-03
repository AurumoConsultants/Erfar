import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@erfar/shared'

// Verifies the current session belongs to an admin, using the regular
// RLS-scoped client (a user can always read their own profile row).
// Returns null if not authenticated or not an admin.
export async function getAdminProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) return null

  return profile as Profile
}
