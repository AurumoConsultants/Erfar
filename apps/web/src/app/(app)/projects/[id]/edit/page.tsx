'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PROJECT_CATEGORY_TYPES, PROJECT_CATEGORY_SUBTYPES, PROCUREMENT_FORMS, CONTRACT_FORMS } from '@erfar/shared'
import type { Project, ProjectCategoryType, ProjectCategorySubtype, ProcurementForm, ContractForm } from '@erfar/shared'

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const [project, setProject] = useState<Project | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('projects').select('*').eq('id', id).single().then(({ data }) => setProject(data))
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!project) return
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('projects')
      .update({
        name: project.name,
        description: project.description,
        location: project.location,
        start_date: project.start_date,
        end_date: project.end_date,
        status: project.status,
        category_type: project.category_type,
        category_subtype: project.category_subtype,
        procurement_form: project.procurement_form,
        contract_form: project.contract_form,
      })
      .eq('id', id)

    if (updateError) { setError(updateError.message); setSaving(false); return }
    router.push(`/projects/${id}`)
    router.refresh()
  }

  if (!project) return <p className="text-gray-400 text-sm">Laddar...</p>

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Redigera projekt</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Projektnamn</label>
          <input required value={project.name} onChange={e => setProject({ ...project, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Beskrivning</label>
          <textarea value={project.description ?? ''} onChange={e => setProject({ ...project, description: e.target.value })} rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Plats</label>
          <input value={project.location ?? ''} onChange={e => setProject({ ...project, location: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Typ av projekt</label>
            <select required value={project.category_type} onChange={e => setProject({ ...project, category_type: e.target.value as ProjectCategoryType })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {PROJECT_CATEGORY_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kategori</label>
            <select required value={project.category_subtype} onChange={e => setProject({ ...project, category_subtype: e.target.value as ProjectCategorySubtype })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {PROJECT_CATEGORY_SUBTYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Upphandlingsform</label>
            <select required value={project.procurement_form} onChange={e => setProject({ ...project, procurement_form: e.target.value as ProcurementForm })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {PROCUREMENT_FORMS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Entreprenadform</label>
            <select required value={project.contract_form} onChange={e => setProject({ ...project, contract_form: e.target.value as ContractForm })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {CONTRACT_FORMS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Startdatum</label>
            <input type="date" value={project.start_date ?? ''} onChange={e => setProject({ ...project, start_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slutdatum</label>
            <input type="date" value={project.end_date ?? ''} onChange={e => setProject({ ...project, end_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select value={project.status} onChange={e => setProject({ ...project, status: e.target.value as Project['status'] })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="active">Aktivt</option>
            <option value="completed">Avslutat</option>
            <option value="archived">Arkiverat</option>
          </select>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={saving}
          className="w-full bg-blue-700 text-white font-semibold py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition">
          {saving ? 'Sparar...' : 'Spara ändringar'}
        </button>
      </form>
    </div>
  )
}
