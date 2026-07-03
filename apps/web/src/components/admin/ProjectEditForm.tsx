'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PROJECT_CATEGORY_TYPES, PROJECT_CATEGORY_SUBTYPES } from '@erfar/shared'
import type { Project, ProjectCategoryType, ProjectCategorySubtype, ProjectStatus } from '@erfar/shared'

interface CompanyOption { id: string; name: string }

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Aktivt',
  completed: 'Avslutat',
  archived: 'Arkiverat',
}

export default function ProjectEditForm({ project, companies }: { project: Project; companies: CompanyOption[] }) {
  const router = useRouter()
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')
  const [location, setLocation] = useState(project.location ?? '')
  const [startDate, setStartDate] = useState(project.start_date ?? '')
  const [endDate, setEndDate] = useState(project.end_date ?? '')
  const [status, setStatus] = useState<ProjectStatus>(project.status)
  const [categoryType, setCategoryType] = useState<ProjectCategoryType>(project.category_type)
  const [categorySubtype, setCategorySubtype] = useState<ProjectCategorySubtype>(project.category_subtype)
  const [companyId, setCompanyId] = useState(project.company_id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch(`/api/admin/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        location,
        start_date: startDate,
        end_date: endDate,
        status,
        category_type: categoryType,
        category_subtype: categorySubtype,
        company_id: companyId,
      }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Något gick fel.'); setSaving(false); return }
    router.push('/admin/projects')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium mb-1">Projektnamn</label>
        <input required value={name} onChange={e => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Företag</label>
        <select value={companyId} onChange={e => setCompanyId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Typ av projekt</label>
          <select value={categoryType} onChange={e => setCategoryType(e.target.value as ProjectCategoryType)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {PROJECT_CATEGORY_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Kategori</label>
          <select value={categorySubtype} onChange={e => setCategorySubtype(e.target.value as ProjectCategorySubtype)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {PROJECT_CATEGORY_SUBTYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <select value={status} onChange={e => setStatus(e.target.value as ProjectStatus)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {(Object.entries(STATUS_LABELS) as [ProjectStatus, string][]).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
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
      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition">
          {saving ? 'Sparar...' : 'Spara'}
        </button>
        <button type="button" onClick={() => router.push('/admin/projects')}
          className="border border-gray-300 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition">
          Avbryt
        </button>
      </div>
    </form>
  )
}
