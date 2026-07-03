import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LessonWizard from '@/components/LessonWizard'
import { allowedPhasesForRole } from '@erfar/shared'

export default async function NewLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase.from('projects').select('id, company_id').eq('id', id).single()
  if (!project) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  const { data: tags } = await supabase.from('tags').select('kind, name').eq('company_id', project.company_id)

  const byKind = (kind: string) => (tags ?? []).filter(t => t.kind === kind).map(t => t.name)

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Logga en lärdom</h1>
      <LessonWizard
        projectId={project.id}
        companyId={project.company_id}
        existingTagNames={byKind('tag')}
        existingWorkTypes={byKind('work_type')}
        existingBuildingParts={byKind('building_part')}
        allowedPhases={allowedPhasesForRole(profile?.role)}
      />
    </div>
  )
}
