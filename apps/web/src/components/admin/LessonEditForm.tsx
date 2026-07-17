'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LESSON_TYPES, CONSTRUCTION_PHASES } from '@erfar/shared'
import type { Lesson, LessonType, ConstructionPhase } from '@erfar/shared'

interface ProjectOption { id: string; name: string; company_name: string | null }

export default function LessonEditForm({ lesson, projects }: { lesson: Lesson; projects: ProjectOption[] }) {
  const router = useRouter()
  const [title, setTitle] = useState(lesson.title)
  const [description, setDescription] = useState(lesson.description ?? '')
  const [type, setType] = useState<LessonType>(lesson.type)
  const [constructionPhase, setConstructionPhase] = useState<ConstructionPhase>(lesson.construction_phase)
  const [contactPhone, setContactPhone] = useState(lesson.contact_phone ?? '')
  const [contactEmail, setContactEmail] = useState(lesson.contact_email ?? '')
  const [projectId, setProjectId] = useState(lesson.project_id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        type,
        construction_phase: constructionPhase,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        project_id: projectId,
      }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Något gick fel.'); setSaving(false); return }
    router.push('/admin/lessons')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium mb-1">Rubrik</label>
        <input required value={title} onChange={e => setTitle(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Projekt</label>
        <select value={projectId} onChange={e => setProjectId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}{p.company_name ? ` (${p.company_name})` : ''}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Typ</label>
        <div className="flex gap-2">
          {LESSON_TYPES.map(lt => (
            <button key={lt.value} type="button" onClick={() => setType(lt.value)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${
                type === lt.value ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={type === lt.value ? { backgroundColor: lt.color } : undefined}>
              {lt.icon} {lt.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Var i byggprocessen</label>
        <div className="grid grid-cols-5 gap-1.5">
          {CONSTRUCTION_PHASES.map(p => (
            <button key={p.value} type="button" onClick={() => setConstructionPhase(p.value)}
              className={`py-2 px-1 rounded-lg text-xs font-semibold border transition leading-tight ${
                constructionPhase === p.value ? 'bg-orange-600 text-white border-orange-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Beskrivning</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Mobilnummer</label>
          <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">E-post</label>
          <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition">
          {saving ? 'Sparar...' : 'Spara'}
        </button>
        <button type="button" onClick={() => router.push('/admin/lessons')}
          className="border border-gray-300 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition">
          Avbryt
        </button>
      </div>
    </form>
  )
}
