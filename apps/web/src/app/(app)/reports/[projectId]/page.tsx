import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReportView from './ReportView'
import type { Lesson } from '@erfar/shared'

export default async function ProjectReportPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single()
  if (!project) notFound()

  const { data: lessonsRaw } = await supabase
    .from('lessons')
    .select('*, tags:lesson_tags(tag:tags(*)), author:profiles(*)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  const lessons: Lesson[] = (lessonsRaw ?? []).map((l: any) => ({
    ...l,
    tags: (l.tags ?? []).map((lt: any) => lt.tag).filter(Boolean),
  }))

  return <ReportView project={project} lessons={lessons} />
}
