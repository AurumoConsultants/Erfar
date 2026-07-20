'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PROJECT_CATEGORY_TYPES, PROJECT_CATEGORY_SUBTYPES, PROCUREMENT_FORMS, CONTRACT_FORMS } from '@erfar/shared'
import type { ProjectCategoryType, ProjectCategorySubtype, ProcurementForm, ContractForm } from '@erfar/shared'
import TagInput from '@/components/TagInput'

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
  const [existingTagNames, setExistingTagNames] = useState<string[]>([])
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
      if (!profile?.company_id) return
      setCompanyId(profile.company_id)
      const { data: existingTags } = await supabase.from('tags').select('name').eq('company_id', profile.company_id).eq('kind', 'tag')
      setExistingTagNames((existingTags ?? []).map(t => t.name))
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    // ones were entered, creating any new company tags as needed.
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
          <TagInput value={tags} onChange={setTags} suggestions={existingTagNames} allowCreate={false} />
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
  )
}
