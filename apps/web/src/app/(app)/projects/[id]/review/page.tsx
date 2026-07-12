import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReviewQueue from '@/components/ReviewQueue'
import type { Lesson } from '@erfar/shared'

// Review meeting: only the client who owns the project, or one of its
// entrepreneur team members, runs this — matches who'd actually be in the
// room. Konsult and spectators never see this page.
export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const { data: project } = await supabase.from('projects').select('id, name, company_id').eq('id', id).single()
  if (!project) notFound()

  const isClientOwner = profile?.role === 'client' && profile.company_id === project.company_id
  let isEntrepreneur = false
  if (!isClientOwner) {
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', id)
      .eq('profile_id', user!.id)
      .maybeSingle()
    isEntrepreneur = membership?.role === 'entrepreneur'
  }
  if (!isClientOwner && !isEntrepreneur) redirect(`/projects/${id}`)

  const { data: lessonsRaw } = await supabase
    .from('lessons')
    .select('*, tags:lesson_tags(tag:tags(*)), images:lesson_images(*), author:profiles(*)')
    .eq('project_id', id)
    .is('reviewed_at', null)
    .order('created_at', { ascending: true })

  const lessons: Lesson[] = (lessonsRaw ?? []).map((l: any) => ({
    ...l,
    tags: (l.tags ?? []).map((lt: any) => lt.tag).filter(Boolean),
  }))

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href={`/projects/${id}`} className="text-sm text-blue-700 hover:underline">← Tillbaka till projektet</Link>
        <h1 className="text-2xl font-bold mt-2">Granska lärdomar</h1>
        <p className="text-sm text-gray-500 mt-1">
          {project.name} · gå igenom lärdomarna tillsammans, komplettera med det som kommer fram
          på mötet och diskutera en lösning för utmaningarna.
        </p>
      </div>
      <ReviewQueue lessons={lessons} />
    </div>
  )
}
