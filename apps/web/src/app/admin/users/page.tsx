import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminProfile } from '@/lib/admin/guard'
import UsersTable from './UsersTable'

export default async function AdminUsersPage() {
  const caller = await getAdminProfile()
  const supabase = createAdminClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_admin, company_id, company:companies(name)')
    .order('created_at', { ascending: false })

  const users = (profiles ?? []).map(p => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    role: p.role,
    is_admin: p.is_admin,
    company_id: p.company_id,
    company_name: (p.company as unknown as { name: string } | null)?.name ?? null,
  }))

  const { data: companies } = await supabase.from('companies').select('id, name').order('name')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Användare</h1>
      <UsersTable users={users} companies={companies ?? []} currentUserId={caller!.id} />
    </div>
  )
}
