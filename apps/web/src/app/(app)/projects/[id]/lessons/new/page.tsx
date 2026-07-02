import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LessonForm from '@/components/LessonForm'

export default async function NewLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase.from('projects').select('id, company_id').eq('id', id).single()
  if (!project) notFound()

  const { data: tags } = await supabase.from('tags').select('name').eq('company_id', project.company_id)

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Logga en lärdom</h1>
      <LessonForm projectId={project.id} companyId={project.company_id} existingTagNames={(tags ?? []).map(t => t.name)} />
    </div>
  )
}
