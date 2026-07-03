import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminDeleteButton from '@/components/AdminDeleteButton'

export default async function AdminCompaniesPage() {
  const supabase = createAdminClient()

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, account_type, kommun, org_number, created_at, projects(count)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Företag</h1>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Namn</th>
              <th className="px-4 py-3 font-medium">Typ</th>
              <th className="px-4 py-3 font-medium">Kommun</th>
              <th className="px-4 py-3 font-medium">Org.nummer</th>
              <th className="px-4 py-3 font-medium">Projekt</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(companies ?? []).map(c => (
              <tr key={c.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-500">{c.account_type === 'kommun' ? 'Kommun' : 'Privat företag'}</td>
                <td className="px-4 py-3 text-gray-500">{c.kommun ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.org_number ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{(c.projects as unknown as { count: number }[])?.[0]?.count ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/companies/${c.id}/edit`}
                      className="text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                      Redigera
                    </Link>
                    <AdminDeleteButton
                      url={`/api/admin/companies/${c.id}`}
                      confirmMessage={`Ta bort "${c.name}" och alla dess projekt och lärdomar permanent?`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
