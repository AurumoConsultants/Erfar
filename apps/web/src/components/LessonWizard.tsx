'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { lessonSchema } from '@/lib/validations/lesson'
import { suggestTags } from '@/lib/ai/suggestTags'
import { LESSON_TYPES, CONSTRUCTION_PHASES, WORK_TYPES, BUILDING_PARTS, SUGGESTED_TAGS } from '@erfar/shared'
import type { LessonType, ConstructionPhase } from '@erfar/shared'
import CategoryPicker from './CategoryPicker'
import MediaUploader from './MediaUploader'
import VoiceRecorder from './VoiceRecorder'
import TagInput from './TagInput'

interface LessonWizardProps {
  projectId: string
  companyId: string
  existingTagNames: string[]
  existingWorkTypes: string[]
  existingBuildingParts: string[]
  // Entrepreneurs only ever log lessons from the execution phase — no
  // choice is shown, the value is fixed.
  lockPhaseToExecution?: boolean
}

const TOTAL_STEPS = 5

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function LessonWizard({
  projectId, companyId, existingTagNames, existingWorkTypes, existingBuildingParts, lockPhaseToExecution,
}: LessonWizardProps) {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [type, setType] = useState<LessonType>('challenge')
  const [constructionPhase, setConstructionPhase] = useState<ConstructionPhase>(
    lockPhaseToExecution ? 'execution' : CONSTRUCTION_PHASES[0].value
  )
  const [workType, setWorkType] = useState('')
  const [buildingPart, setBuildingPart] = useState('')
  const [media, setMedia] = useState<File[]>([])
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [suggested, setSuggested] = useState<string[]>([])
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [suggestionsChecked, setSuggestionsChecked] = useState(false)

  function goNext() {
    setError('')
    if (step === 2 && (!workType || !buildingPart)) {
      setError('Välj en kategori i båda nivåerna för att fortsätta.')
      return
    }
    if (step === 4 && !description.trim()) {
      setError('Skriv en kommentar för att fortsätta.')
      return
    }
    // First "Nästa" on step 4 runs the tag suggestion and stays put so the
    // user can review/add the suggestions before actually moving on.
    if (step === 4 && !suggestionsChecked) {
      const candidates = Array.from(new Set([...existingTagNames, ...SUGGESTED_TAGS]))
      setSuggested(suggestTags(description, candidates).filter(s => !tags.includes(s)))
      setSuggestionsChecked(true)
      return
    }
    setStep(s => Math.min(TOTAL_STEPS, s + 1))
  }

  function goBack() {
    setError('')
    setStep(s => Math.max(1, s - 1))
  }

  function toggleSuggested(tag: string) {
    setTags(prev => [...prev, tag])
    setSuggested(prev => prev.filter(s => s !== tag))
  }

  async function handleFinish() {
    const title = `${capitalize(workType)} – ${capitalize(buildingPart)}`
    const values = {
      type,
      construction_phase: constructionPhase,
      title,
      description,
      tags,
      work_type: workType,
      building_part: buildingPart,
      contact_phone: contactPhone,
      contact_email: contactEmail,
    }
    const parsed = lessonSchema.safeParse(values)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Ogiltiga uppgifter.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Inte inloggad')

      const { data: workTypeRow } = await supabase
        .from('tags')
        .upsert({ company_id: companyId, kind: 'work_type', name: workType }, { onConflict: 'company_id,kind,name' })
        .select()
        .single()
      const { data: buildingPartRow } = await supabase
        .from('tags')
        .upsert({ company_id: companyId, kind: 'building_part', name: buildingPart }, { onConflict: 'company_id,kind,name' })
        .select()
        .single()

      const { data: inserted, error: insertError } = await supabase
        .from('lessons')
        .insert({
          project_id: projectId,
          type,
          construction_phase: constructionPhase,
          title,
          description: description || null,
          work_type_id: workTypeRow?.id ?? null,
          building_part_id: buildingPartRow?.id ?? null,
          contact_phone: contactPhone || null,
          contact_email: contactEmail || null,
          created_by: user.id,
        })
        .select()
        .single()
      if (insertError) throw insertError
      const lessonId = inserted.id

      for (const tagName of tags) {
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
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i + 1 <= step ? 'bg-blue-700' : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="text-xs text-gray-400">Steg {step} av {TOTAL_STEPS}</p>

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Typ</label>
            <div className="flex gap-2">
              {LESSON_TYPES.map(lt => (
                <button
                  key={lt.value}
                  type="button"
                  onClick={() => setType(lt.value)}
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
            {lockPhaseToExecution ? (
              <span className="inline-block bg-blue-700 text-white text-xs font-semibold py-2 px-3 rounded-lg">
                {CONSTRUCTION_PHASES.find(p => p.value === 'execution')?.label}
              </span>
            ) : (
              <div className="grid grid-cols-5 gap-1.5">
                {CONSTRUCTION_PHASES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setConstructionPhase(p.value)}
                    className={`py-2 px-1 rounded-lg text-xs font-semibold border transition leading-tight ${
                      constructionPhase === p.value
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <CategoryPicker
            label="Vad har gjorts?"
            kind="work_type"
            companyId={companyId}
            value={workType}
            onChange={setWorkType}
            presets={WORK_TYPES}
            existing={existingWorkTypes}
            addCustomLabel="Lägg till egen..."
          />
          {workType && (
            <CategoryPicker
              label="Vilken byggdel?"
              kind="building_part"
              companyId={companyId}
              value={buildingPart}
              onChange={setBuildingPart}
              presets={BUILDING_PARTS}
              existing={existingBuildingParts}
              addCustomLabel="Lägg till egen..."
            />
          )}
        </div>
      )}

      {step === 3 && (
        <MediaUploader
          files={media}
          onChange={setMedia}
          addLabel="Lägg till foto eller video"
          gdprNotice="Se till att inga personer syns i bilden eller videon, med hänsyn till GDPR."
        />
      )}

      {step === 4 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium">Kommentar</label>
          <textarea
            value={description}
            onChange={e => { setDescription(e.target.value); setSuggestionsChecked(false) }}
            rows={5}
            placeholder="Beskriv lärdomen..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <VoiceRecorder
            onTranscript={text => { setDescription(prev => (prev ? `${prev} ${text}` : text)); setSuggestionsChecked(false) }}
            recordLabel="Spela in röst"
            stopLabel="Stoppa inspelning"
            recordingLabel="Lyssnar..."
            notSupportedLabel="Röstinspelning stöds inte i denna webbläsare."
          />
          <div>
            <label className="block text-sm font-medium mb-1">Taggar</label>
            <TagInput value={tags} onChange={setTags} suggestions={existingTagNames} />
          </div>
          {suggested.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Föreslagna taggar utifrån texten</p>
              <div className="flex flex-wrap gap-2">
                {suggested.map(s => (
                  <button key={s} type="button" onClick={() => toggleSuggested(s)}
                    className="text-xs border border-blue-200 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-50">
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Valfritt. Så att en framtida läsare av lärdomen kan höra av sig med frågor.
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">Mobilnummer</label>
            <input
              type="tel"
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">E-post</label>
            <input
              type="email"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        {step > 1 && (
          <button type="button" onClick={goBack}
            className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-50 transition">
            Tillbaka
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button type="button" onClick={goNext}
            className="flex-1 bg-blue-700 text-white font-semibold py-2 rounded-lg hover:bg-blue-800 transition">
            Nästa
          </button>
        ) : (
          <button type="button" onClick={handleFinish} disabled={saving}
            className="flex-1 bg-blue-700 text-white font-semibold py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition">
            {saving ? 'Sparar...' : 'Spara lärdom'}
          </button>
        )}
      </div>
    </div>
  )
}
