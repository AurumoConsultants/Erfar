import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PROJECT_CATEGORY_TYPES, PROJECT_CATEGORY_SUBTYPES } from '@erfar/shared'

const statusLabels: Record<string, string> = {
  active: 'Aktivt',
  completed: 'Avslutat',
  archived: 'Arkiverat',
}

const categoryTypeLabel = (v: string) => PROJECT_CATEGORY_TYPES.find(c => c.value === v)?.label ?? v
const categorySubtypeLabel = (v: string) => PROJECT_CATEGORY_SUBTYPES.find(c => c.value === v)?.label ?? v

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, location, status, start_date, end_date, category_type, category_subtype')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projekt</h1>
        {profile?.role === 'client' && (
          <Link href="/projects/new" className="bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-orange-700 transition">
            Nytt projekt
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(projects ?? []).map(p => (
          <Link key={p.id} href={`/projects/${p.id}`}
            className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold">{p.name}</h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{statusLabels[p.status] ?? p.status}</span>
            </div>
            {p.location && <p className="text-sm text-gray-500 mt-1">{p.location}</p>}
            <p className="text-xs text-gray-400 mt-2">
              {categoryTypeLabel(p.category_type)} · {categorySubtypeLabel(p.category_subtype)}
            </p>
          </Link>
        ))}
      </div>
      {(projects ?? []).length === 0 && (
        <p className="text-gray-400 text-sm">Inga projekt än.</p>
      )}
    </div>
  )
}
