import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import LessonEditForm from '@/components/admin/LessonEditForm'

export default async function AdminLessonEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: lesson } = await supabase.from('lessons').select('*').eq('id', id).single()
  if (!lesson) notFound()

  const { data: projectsRaw } = await supabase
    .from('projects')
    .select('id, name, company:companies(name)')
    .order('name')

  const projects = (projectsRaw ?? []).map(p => ({
    id: p.id,
    name: p.name,
    company_name: (p.company as unknown as { name: string } | null)?.name ?? null,
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Redigera lärdom</h1>
      <LessonEditForm lesson={lesson} projects={projects} />
    </div>
  )
}
