import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LESSON_TYPES, CONSTRUCTION_PHASES } from '@erfar/shared'
import DeleteLessonButton from './DeleteLessonButton'

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id, lessonId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*, tags:lesson_tags(tag:tags(*)), images:lesson_images(*), author:profiles(*), work_type:tags!work_type_id(*), building_part:tags!building_part_id(*)')
    .eq('id', lessonId)
    .single()
  if (!lesson) notFound()

  const typeInfo = LESSON_TYPES.find(t => t.value === lesson.type)!
  const phaseInfo = CONSTRUCTION_PHASES.find(p => p.value === lesson.construction_phase)
  const tags = (lesson.tags ?? []).map((lt: any) => lt.tag).filter(Boolean)
  const images = lesson.images ?? []

  const mediaUrls = await Promise.all(
    images.map(async (img: { storage_path: string; media_type: 'image' | 'video' }) => {
      const { data } = await supabase.storage.from('lesson-images').createSignedUrl(img.storage_path, 3600)
      return { url: data?.signedUrl, media_type: img.media_type }
    })
  )

  const isAuthor = lesson.created_by === user?.id

  return (
    <div className="max-w-2xl space-y-5">
      <Link href={`/projects/${id}`} className="text-sm text-blue-700 hover:underline">← Tillbaka till projektet</Link>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none">{typeInfo.icon}</span>
            <div>
              <h1 className="text-xl font-bold">{lesson.title}</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {lesson.author?.full_name} · {new Date(lesson.created_at).toLocaleDateString('sv-SE')}
              </p>
            </div>
          </div>
          {isAuthor && (
            <div className="flex gap-2">
              <Link href={`/projects/${id}/lessons/${lessonId}/edit`}
                className="text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                Redigera
              </Link>
              <DeleteLessonButton lessonId={lessonId} projectId={id} />
            </div>
          )}
        </div>

        {lesson.description && <p className="text-gray-700 whitespace-pre-wrap">{lesson.description}</p>}

        <div className="flex flex-wrap gap-2">
          {phaseInfo && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{phaseInfo.label}</span>
          )}
          {lesson.work_type && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{lesson.work_type.name}</span>
          )}
          {lesson.building_part && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{lesson.building_part.name}</span>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: { id: string; name: string }) => (
              <span key={tag.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{tag.name}</span>
            ))}
          </div>
        )}

        {mediaUrls.filter(m => m.url).length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {mediaUrls.filter(m => m.url).map((m, i) => (
              m.media_type === 'video' ? (
                <video key={i} src={m.url} controls className="w-full aspect-square object-cover rounded-lg border border-gray-200 bg-black" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={m.url} alt="" className="w-full aspect-square object-cover rounded-lg border border-gray-200" />
              )
            ))}
          </div>
        )}

        {(lesson.contact_phone || lesson.contact_email) && (
          <div className="border-t border-gray-100 pt-4 text-sm">
            <p className="text-gray-400 mb-1">Kontakt</p>
            {lesson.contact_phone && <p className="text-gray-700">{lesson.contact_phone}</p>}
            {lesson.contact_email && <p className="text-gray-700">{lesson.contact_email}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
