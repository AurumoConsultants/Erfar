import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendInviteEmail } from '@/lib/email/sendInviteEmail'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, email, role } = await req.json()
  if (!['entrepreneur', 'spectator_project', 'spectator_company'].includes(role)) {
    return NextResponse.json({ error: 'Ogiltig roll' }, { status: 400 })
  }
  if (role !== 'spectator_company' && !projectId) {
    return NextResponse.json({ error: 'Projekt krävs för denna roll' }, { status: 400 })
  }

  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, role, company_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'client' || !profile.company_id) {
    return NextResponse.json({ error: 'Åtkomst nekad' }, { status: 403 })
  }

  let projectName: string | null = null
  if (projectId) {
    const { data: project } = await adminClient
      .from('projects')
      .select('id, name, company_id')
      .eq('id', projectId)
      .single()
    if (!project || project.company_id !== profile.company_id) {
      return NextResponse.json({ error: 'Åtkomst nekad' }, { status: 403 })
    }
    projectName = project.name
  }

  const { data: invitation, error } = await adminClient
    .from('invitations')
    .insert({
      company_id: profile.company_id,
      project_id: role === 'spectator_company' ? null : projectId,
      email,
      role,
      invited_by: profile.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/invite/${invitation.token}`

  const { data: company } = await adminClient
    .from('companies')
    .select('name')
    .eq('id', profile.company_id)
    .single()

  const { sent, error: emailError } = await sendInviteEmail({
    to: email,
    inviterName: profile.full_name,
    companyName: company?.name ?? '',
    projectName: role === 'spectator_company' ? null : projectName,
    role,
    inviteUrl,
  })

  return NextResponse.json({ inviteUrl, token: invitation.token, emailSent: sent, emailError })
}
