import { createClient } from '@supabase/supabase-js'

// Service-role client: bypasses RLS entirely. Server-only — never import
// this from a 'use client' file. Used by /admin routes/pages, which gate
// access themselves by checking the caller's own profile.is_admin first.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
