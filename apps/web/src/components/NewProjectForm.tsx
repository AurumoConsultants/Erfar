'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PROJECT_CATEGORY_TYPES, PROJECT_CATEGORY_SUBTYPES, PROCUREMENT_FORMS, CONTRACT_FORMS } from '@erfar/shared'
import type { ProjectCategoryType, ProjectCategorySubtype, ProcurementForm, ContractForm } from '@erfar/shared'
import TagWizard from '@/components/TagWizard'
import TagTree from '@/components/TagTree'

export default function NewProjectForm() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [categoryType, setCategoryType] = useState<ProjectCategoryType>(PROJECT_CATEGORY_TYPES[0].value)
  const [categorySubtype, setCategorySubtype] = useState<ProjectCategorySubtype>(PROJECT_CATEGORY_SUBTYPES[0].value)
  const [procurementForm, setProcurementForm] = useState<ProcurementForm>(PROCUREMENT_FORMS[0].value)
  const [contractForm, setContractForm] = useState<ContractForm>(CONTRACT_FORMS[0].value)
  const [tags, setTags] = useState<string[]>([])
  const [wizardStarted, setWizardStarted] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function addTag(tagName: string) {
    setTags(prev => prev.includes(tagName) ? prev : [...prev, tagName])
  }
  function removeTag(tagName: string) {
    setTags(prev => prev.filter(t => t !== tagName))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user!.id).single()
    if (!profile?.company_id) { setError('Inget företag hittades.'); setSaving(false); return }

    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert({
        company_id: profile.company_id,
        name,
        description: description || null,
        location: location || null,
        start_date: startDate || null,
        end_date: endDate || null,
        category_type: categoryType,
        category_subtype: categorySubtype,
        procurement_form: procurementForm,
        contract_form: contractForm,
        created_by: user!.id,
      })
      .select()
      .single()

    if (insertError) { setError(insertError.message); setSaving(false); return }

    // Tags are the primary "Liknande lärdomar" matching key — attach whichever
    // ones were chosen in the Tag-guide, creating them as company tags as needed.
    for (const tagName of tags) {
      const { data: tagRow } = await supabase
        .from('tags')
        .upsert({ company_id: profile.company_id, kind: 'tag', name: tagName }, { onConflict: 'company_id,kind,name' })
        .select()
        .single()
      if (tagRow) {
        await supabase.from('project_tags').upsert(
          { project_id: project.id, tag_id: tagRow.id },
          { onConflict: 'project_id,tag_id' }
        )
      }
    }

    router.push(`/projects/${project.id}?new=1`)
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold mb-6">Nytt projekt</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Projektnamn</label>
            <input required value={name} onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Beskrivning</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Plats</label>
            <input value={location} onChange={e => setLocation(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Taggar</label>
            <p className="text-xs text-gray-400 mb-2">
              Avgör vilka lärdomar som visas som &quot;Liknande lärdomar&quot; för projektet — övriga fält nedan är bara allmän information som går att filtrera på.
            </p>
            {!wizardStarted ? (
              <button
                type="button"
                onClick={() => setWizardStarted(true)}
                className="border border-orange-300 text-orange-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-orange-50 transition"
              >
                Starta Tag-guide för detta projekt
              </button>
            ) : (
              <TagWizard selected={tags} onAdd={addTag} />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Typ av projekt</label>
              <select required value={categoryType} onChange={e => setCategoryType(e.target.value as ProjectCategoryType)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PROJECT_CATEGORY_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kategori</label>
              <select required value={categorySubtype} onChange={e => setCategorySubtype(e.target.value as ProjectCategorySubtype)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PROJECT_CATEGORY_SUBTYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Upphandlingsform</label>
              <select required value={procurementForm} onChange={e => setProcurementForm(e.target.value as ProcurementForm)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PROCUREMENT_FORMS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Entreprenadform</label>
              <select required value={contractForm} onChange={e => setContractForm(e.target.value as ContractForm)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CONTRACT_FORMS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Startdatum</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slutdatum</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={saving}
            className="w-full bg-orange-600 text-white font-semibold py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition">
            {saving ? 'Sparar...' : 'Skapa projekt'}
          </button>
        </form>
      </div>

      <TagTree tags={tags} onRemove={removeTag} />
    </div>
  )
}
