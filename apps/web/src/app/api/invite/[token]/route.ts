import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Public lookup by token (the token itself is the secret / bearer of access).
// Uses the service role since the invitee isn't authenticated yet and the
// invitations RLS policy is scoped to the inviting company's own members.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const { data: invitation, error } = await adminClient
    .from('invitations')
    .select('id, email, role, project_id, company_id, accepted_at, expires_at')
    .eq('token', token)
    .single()

  if (error || !invitation || invitation.accepted_at || new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Inbjudan är ogiltig, har gått ut eller har redan använts.' }, { status: 400 })
  }

  const { data: company } = await adminClient
    .from('companies')
    .select('id, name')
    .eq('id', invitation.company_id)
    .single()

  let project: { id: string; name: string; location: string | null } | null = null
  if (invitation.project_id) {
    const { data } = await adminClient
      .from('projects')
      .select('id, name, location')
      .eq('id', invitation.project_id)
      .single()
    project = data ?? null
  }

  return NextResponse.json({
    email: invitation.email,
    role: invitation.role,
    company,
    project,
  })
}
