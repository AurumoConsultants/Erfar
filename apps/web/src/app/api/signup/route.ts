import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { isValidSwedishOrgNumber } from '@/lib/validations/orgNumber'
import { SWEDISH_KOMMUNER } from '@erfar/shared'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { email, password, fullName, companyName, orgNumber, accountType, kommun } = await req.json()

  if (accountType === 'kommun') {
    if (!SWEDISH_KOMMUNER.includes(kommun)) {
      return NextResponse.json({ error: 'Ogiltig kommun.' }, { status: 400 })
    }
    if (!isValidSwedishOrgNumber(orgNumber ?? '')) {
      return NextResponse.json({ error: 'Ogiltigt organisationsnummer för det kommunala bolaget.' }, { status: 400 })
    }
  }

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: fullName },
    email_confirm: true,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  const userId = authData.user.id

  const { data: company, error: companyError } = await adminClient
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

  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert({ id: userId, email, full_name: fullName, company_id: company.id, role: 'client' }, { onConflict: 'id' })
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
