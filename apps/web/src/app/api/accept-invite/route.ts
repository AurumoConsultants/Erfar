import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function profileRoleFor(inviteRole: string): 'entrepreneur' | 'spectator' | 'konsult' | 'mobil_anvandare' {
  if (inviteRole === 'entrepreneur') return 'entrepreneur'
  if (inviteRole === 'konsult') return 'konsult'
  if (inviteRole === 'mobil_anvandare') return 'mobil_anvandare'
  return 'spectator'
}

export async function POST(req: Request) {
  const { token, email, password, fullName, isNewUser, companyName } = await req.json()

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
    // An 'entrepreneur' invite creates a persistent, reusable entreprenör
    // organization the first time — later invites (from the same or other
    // clients) reuse it via the existingUser branch above. A
    // 'mobil_anvandare' invite instead joins the inviter's own company_id
    // directly (client org or entreprenör org, whichever sent the invite).
    let companyId: string | null = null
    if (invitation.role === 'entrepreneur') {
      const { data: company, error: companyErr } = await adminClient
        .from('companies')
        .insert({ name: companyName || fullName, account_type: 'entreprenor' })
        .select('id')
        .single()
      if (companyErr) return NextResponse.json({ error: companyErr.message }, { status: 400 })
      companyId = company.id
    } else if (invitation.role === 'mobil_anvandare') {
      companyId = invitation.company_id
    }

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
      company_id: companyId,
    }, { onConflict: 'id' })
  } else {
    return NextResponse.json({ error: 'Kontot hittades inte.' }, { status: 400 })
  }

  if (invitation.role === 'spectator_company') {
    await adminClient
      .from('company_viewers')
      .upsert({ company_id: invitation.company_id, profile_id: userId }, { onConflict: 'company_id,profile_id' })
  } else if (invitation.role !== 'mobil_anvandare') {
    // mobil_anvandare gets no project_members/company_viewers row — access
    // derives purely from sharing company_id with their org's entrepreneur.
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
