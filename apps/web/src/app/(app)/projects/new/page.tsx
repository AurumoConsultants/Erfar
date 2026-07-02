'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PROJECT_CATEGORY_TYPES, PROJECT_CATEGORY_SUBTYPES, CONSTRUCTION_PHASES } from '@erfar/shared'
import type { ProjectCategoryType, ProjectCategorySubtype, ConstructionPhase } from '@erfar/shared'

export default function NewProjectPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [constructionPhase, setConstructionPhase] = useState<ConstructionPhase>(CONSTRUCTION_PHASES[0].value)
  const [categoryType, setCategoryType] = useState<ProjectCategoryType>(PROJECT_CATEGORY_TYPES[0].value)
  const [categorySubtype, setCategorySubtype] = useState<ProjectCategorySubtype>(PROJECT_CATEGORY_SUBTYPES[0].value)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

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
        construction_phase: constructionPhase,
        category_type: categoryType,
        category_subtype: categorySubtype,
        created_by: user!.id,
      })
      .select()
      .single()

    if (insertError) { setError(insertError.message); setSaving(false); return }
    router.push(`/projects/${project.id}`)
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
          <label className="block text-sm font-medium mb-2">Var i byggprocessen</label>
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
          className="w-full bg-blue-700 text-white font-semibold py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition">
          {saving ? 'Sparar...' : 'Skapa projekt'}
        </button>
      </form>
    </div>
  )
}
