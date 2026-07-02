'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { lessonSchema, type LessonFormValues } from '@/lib/validations/lesson'
import { LESSON_TYPES } from '@erfar/shared'
import type { Lesson } from '@erfar/shared'
import TagInput from './TagInput'
import PhotoUploader from './PhotoUploader'

interface LessonFormProps {
  projectId: string
  companyId: string
  existingTagNames: string[]
  lesson?: Lesson
}

export default function LessonForm({ projectId, companyId, existingTagNames, lesson }: LessonFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [photos, setPhotos] = useState<File[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<LessonFormValues>({
    defaultValues: {
      type: lesson?.type ?? 'success',
      title: lesson?.title ?? '',
      description: lesson?.description ?? '',
      tags: lesson?.tags?.map(t => t.name) ?? [],
    },
  })

  const type = watch('type')
  const tags = watch('tags')

  async function onSubmit(values: LessonFormValues) {
    const parsed = lessonSchema.safeParse(values)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Ogiltiga uppgifter.')
      return
    }
    setSaving(true)
    setError('')
    try {
      let lessonId = lesson?.id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Inte inloggad')

      if (lessonId) {
        const { error: updateError } = await supabase
          .from('lessons')
          .update({ type: values.type, title: values.title, description: values.description || null })
          .eq('id', lessonId)
        if (updateError) throw updateError

        await supabase.from('lesson_tags').delete().eq('lesson_id', lessonId)
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('lessons')
          .insert({
            project_id: projectId,
            type: values.type,
            title: values.title,
            description: values.description || null,
            created_by: user.id,
          })
          .select()
          .single()
        if (insertError) throw insertError
        lessonId = inserted.id
      }

      for (const tagName of values.tags) {
        const { data: tagRow } = await supabase
          .from('tags')
          .upsert({ company_id: companyId, name: tagName }, { onConflict: 'company_id,name' })
          .select()
          .single()
        if (tagRow) {
          await supabase.from('lesson_tags').upsert(
            { lesson_id: lessonId, tag_id: tagRow.id },
            { onConflict: 'lesson_id,tag_id' }
          )
        }
      }

      for (const file of photos) {
        const path = `${projectId}/${lessonId}/${crypto.randomUUID()}-${file.name}`
        const { error: uploadError } = await supabase.storage.from('lesson-images').upload(path, file)
        if (!uploadError) {
          await supabase.from('lesson_images').insert({ lesson_id: lessonId, storage_path: path })
        }
      }

      router.push(`/projects/${projectId}/lessons/${lessonId}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Något gick fel.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2">Typ</label>
        <div className="flex gap-2">
          {LESSON_TYPES.map(lt => (
            <button
              key={lt.value}
              type="button"
              onClick={() => setValue('type', lt.value)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${
                type === lt.value ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={type === lt.value ? { backgroundColor: lt.color } : undefined}
            >
              {lt.icon} {lt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Rubrik</label>
        <input
          {...register('title', { required: true })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.title && <p className="text-red-600 text-sm mt-1">Rubrik krävs</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Beskrivning</label>
        <textarea
          {...register('description')}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Taggar</label>
        <TagInput value={tags} onChange={t => setValue('tags', t)} suggestions={existingTagNames} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Foton</label>
        <PhotoUploader files={photos} onChange={setPhotos} />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-700 text-white font-semibold py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition"
      >
        {saving ? 'Sparar...' : 'Spara lärdom'}
      </button>
    </form>
  )
}
