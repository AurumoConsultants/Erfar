import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function profileRoleFor(inviteRole: string): 'entrepreneur' | 'spectator' | 'konsult' {
  if (inviteRole === 'entrepreneur') return 'entrepreneur'
  if (inviteRole === 'konsult') return 'konsult'
  return 'spectator'
}

export async function POST(req: Request) {
  const { token, email, password, fullName, isNewUser } = await req.json()

  const { data: invitation, error: invErr } = await adminClient
    .from('invitations')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (invErr || !invitation) {
    return NextResponse.json({ error: 'Inbjudan är ogiltig, har gått ut eller har redan använts.' }, { status: 400 })
  }

  let userId: string
  const role = profileRoleFor(invitation.role)

  const { data: { users } } = await adminClient.auth.admin.listUsers()
  const existingUser = users.find(u => u.email === email)

  if (existingUser) {
    userId = existingUser.id
    await adminClient.from('profiles').update({ role }).eq('id', userId)
  } else if (isNewUser) {
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name: fullName },
      email_confirm: true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    userId = data.user.id

    await adminClient.from('profiles').upsert({
      id: userId,
      email,
      full_name: fullName,
      role,
      company_id: null,
    }, { onConflict: 'id' })
  } else {
    return NextResponse.json({ error: 'Kontot hittades inte.' }, { status: 400 })
  }

  if (invitation.role === 'spectator_company') {
    await adminClient
      .from('company_viewers')
      .upsert({ company_id: invitation.company_id, profile_id: userId }, { onConflict: 'company_id,profile_id' })
  } else {
    await adminClient
      .from('project_members')
      .upsert(
        { project_id: invitation.project_id, profile_id: userId, role: profileRoleFor(invitation.role) },
        { onConflict: 'project_id,profile_id' }
      )
  }

  await adminClient
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', token)

  return NextResponse.json({ ok: true, projectId: invitation.project_id })
}
