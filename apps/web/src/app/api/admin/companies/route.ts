import { NextResponse } from 'next/server'
import { getAdminProfile } from '@/lib/admin/guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidSwedishOrgNumber } from '@/lib/validations/orgNumber'
import { SWEDISH_KOMMUNER } from '@erfar/shared'

// Superadmin-only: creates a customer company and invites its first user.
// No password is collected here — inviteUserByEmail sends a link to
// /auth/set-password, so the customer proves ownership of their own inbox
// and chooses their own password, rather than the admin typing one for them.
export async function POST(req: Request) {
  const caller = await getAdminProfile()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { companyName, accountType, orgNumber, kommun, adminFullName, adminEmail } = await req.json()

  if (accountType === 'kommun') {
    if (!SWEDISH_KOMMUNER.includes(kommun)) {
      return NextResponse.json({ error: 'Ogiltig kommun.' }, { status: 400 })
    }
    if (!isValidSwedishOrgNumber(orgNumber ?? '')) {
      return NextResponse.json({ error: 'Ogiltigt organisationsnummer för det kommunala bolaget.' }, { status: 400 })
    }
  }

  const supabase = createAdminClient()

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: companyName,
      org_number: orgNumber || null,
      account_type: accountType === 'kommun' ? 'kommun' : 'private_company',
      kommun: accountType === 'kommun' ? kommun : null,
    })
    .select()
    .single()
  if (companyError) return NextResponse.json({ error: companyError.message }, { status: 400 })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(adminEmail, {
    data: { full_name: adminFullName },
    redirectTo: `${baseUrl}/auth/set-password`,
  })
  if (inviteError) {
    // Roll back the company row — no orphaned customer record with no way in.
    await supabase.from('companies').delete().eq('id', company.id)
    return NextResponse.json({ error: inviteError.message }, { status: 400 })
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      { id: invited.user.id, email: adminEmail, full_name: adminFullName, company_id: company.id, role: 'client' },
      { onConflict: 'id' }
    )
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

  return NextResponse.json({ ok: true, companyId: company.id })
}
