import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LessonForm from '@/components/LessonForm'
import type { Lesson } from '@erfar/shared'

export default async function EditLessonPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id, lessonId } = await params
  const supabase = await createClient()

  const { data: project } = await supabase.from('projects').select('id, company_id').eq('id', id).single()
  if (!project) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  const { data: lessonRaw } = await supabase
    .from('lessons')
    .select('*, tags:lesson_tags(tag:tags(*)), work_type:tags!work_type_id(*), building_part:tags!building_part_id(*)')
    .eq('id', lessonId)
    .single()
  if (!lessonRaw) notFound()

  const lesson: Lesson = { ...lessonRaw, tags: (lessonRaw.tags ?? []).map((lt: any) => lt.tag).filter(Boolean) }

  const { data: tags } = await supabase.from('tags').select('kind, name').eq('company_id', project.company_id)
  const byKind = (kind: string) => (tags ?? []).filter(t => t.kind === kind).map(t => t.name)

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Redigera lärdom</h1>
      <LessonForm
        projectId={project.id}
        companyId={project.company_id}
        existingTagNames={byKind('tag')}
        existingWorkTypes={byKind('work_type')}
        existingBuildingParts={byKind('building_part')}
        lesson={lesson}
        lockPhaseToExecution={profile?.role === 'entrepreneur'}
      />
    </div>
  )
}
