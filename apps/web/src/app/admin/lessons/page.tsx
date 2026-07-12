import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { LESSON_TYPES } from '@erfar/shared'
import AdminDeleteButton from '@/components/AdminDeleteButton'

export default async function AdminLessonsPage() {
  const supabase = createAdminClient()

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, type, created_at, project:projects(name, company:companies(name)), author:profiles!created_by(full_name)')
    .order('created_at', { ascending: false })
    .limit(200)

  const typeInfo = (value: string) => LESSON_TYPES.find(t => t.value === value)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Lärdomar</h1>
      <p className="text-sm text-gray-500">Visar de 200 senaste lärdomarna.</p>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Rubrik</th>
              <th className="px-4 py-3 font-medium">Typ</th>
              <th className="px-4 py-3 font-medium">Projekt</th>
              <th className="px-4 py-3 font-medium">Företag</th>
              <th className="px-4 py-3 font-medium">Skapad av</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(lessons ?? []).map(l => {
              const project = l.project as unknown as { name: string; company: { name: string } | null } | null
              const author = l.author as unknown as { full_name: string } | null
              const info = typeInfo(l.type)
              return (
                <tr key={l.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{l.title}</td>
                  <td className="px-4 py-3">
                    <span style={{ color: info?.color }}>{info?.icon} {info?.label ?? l.type}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{project?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{project?.company?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{author?.full_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/lessons/${l.id}/edit`}
                        className="text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                        Redigera
                      </Link>
                      <AdminDeleteButton
                        url={`/api/admin/lessons/${l.id}`}
                        confirmMessage={`Ta bort lärdomen "${l.title}" permanent?`}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
