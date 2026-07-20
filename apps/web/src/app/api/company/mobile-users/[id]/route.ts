import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// mobila användare have no project_members/company_viewers row to delete —
// their access is purely company_id-based, so removal detaches them from
// the org by clearing company_id. Service role required: there's no RLS
// policy letting one profile update another's row.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!caller || !caller.company_id || !['client', 'entrepreneur'].includes(caller.role)) {
    return NextResponse.json({ error: 'Åtkomst nekad' }, { status: 403 })
  }

  const { data: target } = await adminClient
    .from('profiles')
    .select('id, role, company_id')
    .eq('id', id)
    .single()

  if (!target || target.role !== 'mobil_anvandare' || target.company_id !== caller.company_id) {
    return NextResponse.json({ error: 'Åtkomst nekad' }, { status: 403 })
  }

  await adminClient.from('profiles').update({ company_id: null }).eq('id', id)

  return NextResponse.json({ ok: true })
}
