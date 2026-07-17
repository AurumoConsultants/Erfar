'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { lessonSchema, type LessonFormValues } from '@/lib/validations/lesson'
import { LESSON_TYPES, CONSTRUCTION_PHASES, WORK_TYPES, BUILDING_PARTS } from '@erfar/shared'
import type { Lesson, ConstructionPhase } from '@erfar/shared'
import TagInput from './TagInput'
import MediaUploader from './MediaUploader'
import CategoryPicker from './CategoryPicker'

interface LessonFormProps {
  projectId: string
  companyId: string
  existingTagNames: string[]
  existingWorkTypes: string[]
  existingBuildingParts: string[]
  lesson: Lesson
  // Some roles only ever log lessons for a subset of construction phases
  // (entrepreneurs: execution only; konsult: idea_stage/early_stages/design).
  // Undefined/omitted means all phases are selectable.
  allowedPhases?: ConstructionPhase[]
}

// Editing an existing lesson is a single page with every field visible at
// once (unlike the step-by-step wizard used to create a new lesson).
export default function LessonForm({
  projectId, companyId, existingTagNames, existingWorkTypes, existingBuildingParts, lesson, allowedPhases,
}: LessonFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [media, setMedia] = useState<File[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const visiblePhases = CONSTRUCTION_PHASES.filter(p => !allowedPhases || allowedPhases.includes(p.value))
  const phaseGridColsClass = visiblePhases.length >= 5 ? 'grid-cols-5' : 'grid-cols-3'
  const defaultPhase = allowedPhases && !allowedPhases.includes(lesson.construction_phase)
    ? (visiblePhases[0]?.value ?? lesson.construction_phase)
    : lesson.construction_phase

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<LessonFormValues>({
    defaultValues: {
      type: lesson.type,
      construction_phase: defaultPhase,
      title: lesson.title,
      description: lesson.description ?? '',
      tags: lesson.tags?.map(t => t.name) ?? [],
      work_type: lesson.work_type?.name ?? '',
      building_part: lesson.building_part?.name ?? '',
      contact_phone: lesson.contact_phone ?? '',
      contact_email: lesson.contact_email ?? '',
    },
  })

  const type = watch('type')
  const constructionPhase = watch('construction_phase')
  const tags = watch('tags')
  const workType = watch('work_type') ?? ''
  const buildingPart = watch('building_part') ?? ''

  async function onSubmit(values: LessonFormValues) {
    const parsed = lessonSchema.safeParse(values)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Ogiltiga uppgifter.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const lessonId = lesson.id

      let workTypeId: string | null = null
      if (values.work_type) {
        const { data } = await supabase
          .from('tags')
          .upsert({ company_id: companyId, kind: 'work_type', name: values.work_type }, { onConflict: 'company_id,kind,name' })
          .select()
          .single()
        workTypeId = data?.id ?? null
      }
      let buildingPartId: string | null = null
      if (values.building_part) {
        const { data } = await supabase
          .from('tags')
          .upsert({ company_id: companyId, kind: 'building_part', name: values.building_part }, { onConflict: 'company_id,kind,name' })
          .select()
          .single()
        buildingPartId = data?.id ?? null
      }

      const { error: updateError } = await supabase
        .from('lessons')
        .update({
          type: values.type,
          construction_phase: values.construction_phase,
          title: values.title,
          description: values.description || null,
          work_type_id: workTypeId,
          building_part_id: buildingPartId,
          contact_phone: values.contact_phone || null,
          contact_email: values.contact_email || null,
        })
        .eq('id', lessonId)
      if (updateError) throw updateError

      await supabase.from('lesson_tags').delete().eq('lesson_id', lessonId)
      for (const tagName of values.tags) {
        const { data: tagRow } = await supabase
          .from('tags')
          .upsert({ company_id: companyId, kind: 'tag', name: tagName }, { onConflict: 'company_id,kind,name' })
          .select()
          .single()
        if (tagRow) {
          await supabase.from('lesson_tags').upsert(
            { lesson_id: lessonId, tag_id: tagRow.id },
            { onConflict: 'lesson_id,tag_id' }
          )
        }
      }

      for (const file of media) {
        const path = `${projectId}/${lessonId}/${crypto.randomUUID()}-${file.name}`
        const { error: uploadError } = await supabase.storage.from('lesson-images').upload(path, file)
        if (!uploadError) {
          await supabase.from('lesson_images').insert({
            lesson_id: lessonId,
            storage_path: path,
            media_type: file.type.startsWith('video/') ? 'video' : 'image',
          })
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
        <label className="block text-sm font-medium mb-2">Var i byggprocessen</label>
        {visiblePhases.length === 1 ? (
          <span className="inline-block bg-orange-600 text-white text-xs font-semibold py-2 px-3 rounded-lg">
            {visiblePhases[0].label}
          </span>
        ) : (
          <div className={`grid ${phaseGridColsClass} gap-1.5`}>
            {visiblePhases.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setValue('construction_phase', p.value)}
                className={`py-2 px-1 rounded-lg text-xs font-semibold border transition leading-tight ${
                  constructionPhase === p.value
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <CategoryPicker
        label="Vad har gjorts?"
        kind="work_type"
        companyId={companyId}
        value={workType}
        onChange={v => setValue('work_type', v)}
        presets={WORK_TYPES}
        existing={existingWorkTypes}
        addCustomLabel="Lägg till egen..."
      />

      <CategoryPicker
        label="Vilken byggdel?"
        kind="building_part"
        companyId={companyId}
        value={buildingPart}
        onChange={v => setValue('building_part', v)}
        presets={BUILDING_PARTS}
        existing={existingBuildingParts}
        addCustomLabel="Lägg till egen..."
      />

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
        <label className="block text-sm font-medium mb-1">Lägg till nya foton eller videor</label>
        <MediaUploader
          files={media}
          onChange={setMedia}
          addLabel="Lägg till foto eller video"
          gdprNotice="Se till att inga personer syns i bilden eller videon, med hänsyn till GDPR."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Mobilnummer</label>
          <input
            type="tel"
            {...register('contact_phone')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">E-post</label>
          <input
            type="email"
            {...register('contact_email')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.contact_email && <p className="text-red-600 text-sm mt-1">{errors.contact_email.message}</p>}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-orange-600 text-white font-semibold py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition"
      >
        {saving ? 'Sparar...' : 'Spara lärdom'}
      </button>
    </form>
  )
}
