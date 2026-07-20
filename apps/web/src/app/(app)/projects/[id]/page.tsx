import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LessonCard from '@/components/LessonCard'
import SimilarLessons from '@/components/SimilarLessons'
import { PROJECT_CATEGORY_TYPES, PROJECT_CATEGORY_SUBTYPES, PROCUREMENT_FORMS, CONTRACT_FORMS } from '@erfar/shared'
import type { Lesson } from '@erfar/shared'

const statusLabels: Record<string, string> = {
  active: 'Aktivt',
  completed: 'Avslutat',
  archived: 'Arkiverat',
}

const categoryTypeLabel = (v: string) => PROJECT_CATEGORY_TYPES.find(c => c.value === v)?.label ?? v
const categorySubtypeLabel = (v: string) => PROJECT_CATEGORY_SUBTYPES.find(c => c.value === v)?.label ?? v
const procurementFormLabel = (v: string) => PROCUREMENT_FORMS.find(c => c.value === v)?.label ?? v
const contractFormLabel = (v: string) => CONTRACT_FORMS.find(c => c.value === v)?.label ?? v

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ new?: string }>
}) {
  const { id } = await params
  const { new: justCreatedParam } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
  if (!project) notFound()

  const { data: projectTagRows } = await supabase
    .from('project_tags')
    .select('tag:tags(name)')
    .eq('project_id', id)
  const projectTags: string[] = (projectTagRows ?? []).map((r: any) => r.tag?.name).filter(Boolean)

  const { data: lessonsRaw } = await supabase
    .from('lessons')
    .select('*, tags:lesson_tags(tag:tags(*)), images:lesson_images(*)')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  const lessons: Lesson[] = (lessonsRaw ?? []).map((l: any) => ({
    ...l,
    tags: (l.tags ?? []).map((lt: any) => lt.tag).filter(Boolean),
  }))

  const isClientOwner = profile?.role === 'client' && profile.company_id === project.company_id
  let isContributor = false
  let isEntrepreneur = false
  if (!isClientOwner) {
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', id)
      .eq('profile_id', user!.id)
      .maybeSingle()
    isEntrepreneur = membership?.role === 'entrepreneur'
    isContributor = isEntrepreneur || membership?.role === 'konsult'
    // mobila användare (and any other member of the same persistent
    // entreprenör org) have no project_members row of their own — their
    // logging access comes from sharing company_id with the org's entrepreneur.
    if (!isContributor && profile?.role === 'mobil_anvandare') {
      const { data: orgWide } = await supabase.rpc('is_entreprenor_org_on_project', { p_project_id: id })
      isContributor = !!orgWide
    }
  }
  const canLogLesson = isClientOwner || isContributor
  // Client and entrepreneur team members run the review meeting — konsult and
  // spectators don't (matches public.can_review_project in the DB).
  const canReview = isClientOwner || isEntrepreneur
  const pendingReviewCount = lessons.filter(l => !l.reviewed_at).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.location && <p className="text-gray-500 text-sm mt-1">{project.location}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {statusLabels[project.status] ?? project.status}
            </span>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {categoryTypeLabel(project.category_type)} · {categorySubtypeLabel(project.category_subtype)}
            </span>
            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
              {procurementFormLabel(project.procurement_form)} · {contractFormLabel(project.contract_form)}
            </span>
            {projectTags.map(tag => (
              <span key={tag} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {canLogLesson && (
            <Link href={`/projects/${id}/lessons/new`}
              className="bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-orange-700 transition">
              Logga en lärdom
            </Link>
          )}
          {canReview && (
            <Link href={`/projects/${id}/review`}
              className="border border-gray-300 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition inline-flex items-center gap-2">
              Granska lärdomar
              {pendingReviewCount > 0 && (
                <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {pendingReviewCount}
                </span>
              )}
            </Link>
          )}
          {isClientOwner && (
            <>
              <Link href={`/projects/${id}/members`}
                className="border border-gray-300 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                Medlemmar
              </Link>
              <Link href={`/projects/${id}/edit`}
                className="border border-gray-300 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                Redigera
              </Link>
            </>
          )}
        </div>
      </div>

      {project.description && <p className="text-gray-600">{project.description}</p>}

      {isClientOwner && (
        <SimilarLessons
          projectId={id}
          projectTags={projectTags}
          justCreated={justCreatedParam === '1'}
        />
      )}

      <div>
        <h2 className="font-semibold text-lg mb-3">Lärdomar</h2>
        <div className="space-y-3">
          {lessons.map(l => <LessonCard key={l.id} lesson={l} />)}
          {lessons.length === 0 && <p className="text-gray-400 text-sm">Inga lärdomar loggade än.</p>}
        </div>
      </div>
    </div>
  )
}
