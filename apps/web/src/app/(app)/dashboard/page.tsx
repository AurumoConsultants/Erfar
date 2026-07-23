import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LESSON_TYPES } from '@erfar/shared'
import Card from '@/components/ui/Card'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status')
    .order('created_at', { ascending: false })

  const projectIds = (projects ?? []).map(p => p.id)
  const { data: lessons } = projectIds.length
    ? await supabase.from('lessons').select('id, type').in('project_id', projectIds)
    : { data: [] as { id: string; type: string }[] }

  const challengeCount = (lessons ?? []).filter(l => l.type === 'challenge').length
  const successCount = (lessons ?? []).filter(l => l.type === 'success').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Översikt</h1>
        <p className="text-gray-500 text-sm mt-1">Välkommen, {profile?.full_name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-500">Projekt</p>
          <p className="text-3xl font-bold mt-1">{projects?.length ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{LESSON_TYPES[1].icon} Framgångar</p>
          <p className="text-3xl font-bold mt-1">{successCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{LESSON_TYPES[0].icon} Utmaningar</p>
          <p className="text-3xl font-bold mt-1">{challengeCount}</p>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Dina projekt</h2>
          <Link href="/projects" className="text-sm text-blue-700 hover:underline">Visa alla</Link>
        </div>
        <div className="space-y-2">
          {(projects ?? []).slice(0, 5).map(p => (
            <Link key={p.id} href={`/projects/${p.id}`} className="block">
              <Card className="px-4 py-3 hover:border-accent-300 transition">
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-gray-400 ml-2 capitalize">{p.status}</span>
              </Card>
            </Link>
          ))}
          {(projects ?? []).length === 0 && (
            <p className="text-gray-400 text-sm">Inga projekt än.</p>
          )}
        </div>
      </div>
    </div>
  )
}
