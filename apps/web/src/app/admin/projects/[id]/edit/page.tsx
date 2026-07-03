import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import ProjectEditForm from '@/components/admin/ProjectEditForm'

export default async function AdminProjectEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
  if (!project) notFound()

  const { data: companies } = await supabase.from('companies').select('id, name').order('name')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Redigera projekt</h1>
      <ProjectEditForm project={project} companies={companies ?? []} />
    </div>
  )
}
