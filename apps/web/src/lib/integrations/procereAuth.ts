import type { SupabaseClient } from '@supabase/supabase-js'

// Shared by every /api/integrations/procere/* route. The shared secret
// only proves the CALLER is Procere, not which Procere company — this
// confirms org_number is genuinely the entrepreneur on record for the
// target project, closing that gap. Centralized here (not copy-pasted
// per route) since a security check drifting between two copies is a
// real risk.
export function verifyIntegrationSecret(req: Request): boolean {
  const secret = req.headers.get('x-integration-secret')
  return !!secret && secret === process.env.PROCERE_INTEGRATION_SECRET
}

export async function isEntrepreneurOnProject(
  admin: SupabaseClient,
  projectId: string,
  orgNumber: string
): Promise<boolean> {
  const { data } = await admin
    .from('project_members')
    .select('id, profiles!inner(company_id, companies!inner(org_number, account_type))')
    .eq('project_id', projectId)
    .eq('role', 'entrepreneur')
    .eq('profiles.companies.account_type', 'entreprenor')
    .eq('profiles.companies.org_number', orgNumber)
    .maybeSingle()
  return !!data
}
