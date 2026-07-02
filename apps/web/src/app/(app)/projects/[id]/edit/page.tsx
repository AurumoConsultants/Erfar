'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PROJECT_CATEGORY_TYPES, PROJECT_CATEGORY_SUBTYPES, CONSTRUCTION_PHASES } from '@erfar/shared'
import type { Project, ProjectCategoryType, ProjectCategorySubtype, ConstructionPhase } from '@erfar/shared'

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
        construction_phase: project.construction_phase,
        category_type: project.category_type,
        category_subtype: project.category_subtype,
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
        <div>
          <label className="block text-sm font-medium mb-2">Var i byggprocessen</label>
          <div className="grid grid-cols-5 gap-1.5">
            {CONSTRUCTION_PHASES.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setProject({ ...project, construction_phase: p.value as ConstructionPhase })}
                className={`py-2 px-1 rounded-lg text-xs font-semibold border transition leading-tight ${
                  project.construction_phase === p.value
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
