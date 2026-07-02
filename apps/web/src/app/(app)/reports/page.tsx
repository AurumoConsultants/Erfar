import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: projects } = await supabase.from('projects').select('id, name, location').order('name')

  const counts = await Promise.all(
    (projects ?? []).map(async p => {
      const { count } = await supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('project_id', p.id)
      return { ...p, lessonCount: count ?? 0 }
    })
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rapporter</h1>
      <div className="space-y-2">
        {counts.map(p => (
          <Link key={p.id} href={`/reports/${p.id}`}
            className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-blue-300 transition">
            <div>
              <p className="font-medium">{p.name}</p>
              {p.location && <p className="text-xs text-gray-400">{p.location}</p>}
            </div>
            <span className="text-sm text-gray-500">{p.lessonCount} lärdomar</span>
          </Link>
        ))}
        {counts.length === 0 && <p className="text-gray-400 text-sm">Inga projekt än.</p>}
      </div>
    </div>
  )
}
