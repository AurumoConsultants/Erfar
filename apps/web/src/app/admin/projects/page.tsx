import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { PROJECT_CATEGORY_TYPES } from '@erfar/shared'
import AdminDeleteButton from '@/components/AdminDeleteButton'

export default async function AdminProjectsPage() {
  const supabase = createAdminClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, category_type, created_at, company:companies(name), lessons(count)')
    .order('created_at', { ascending: false })

  const categoryLabel = (value: string) => PROJECT_CATEGORY_TYPES.find(c => c.value === value)?.label ?? value

  const statusLabel: Record<string, string> = {
    active: 'Aktivt',
    completed: 'Avslutat',
    archived: 'Arkiverat',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Projekt</h1>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Namn</th>
              <th className="px-4 py-3 font-medium">Företag</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Lärdomar</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(projects ?? []).map(p => (
              <tr key={p.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{(p.company as unknown as { name: string } | null)?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{statusLabel[p.status] ?? p.status}</td>
                <td className="px-4 py-3 text-gray-500">{categoryLabel(p.category_type)}</td>
                <td className="px-4 py-3 text-gray-500">{(p.lessons as unknown as { count: number }[])?.[0]?.count ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/projects/${p.id}/edit`}
                      className="text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                      Redigera
                    </Link>
                    <AdminDeleteButton
                      url={`/api/admin/projects/${p.id}`}
                      confirmMessage={`Ta bort projektet "${p.name}" och alla dess lärdomar permanent?`}
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
