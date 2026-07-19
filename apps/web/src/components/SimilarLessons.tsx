'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LESSON_TYPES, CONSTRUCTION_PHASES, PROJECT_CATEGORY_TYPES, PROJECT_CATEGORY_SUBTYPES } from '@erfar/shared'
import type { ProjectCategoryType, ProjectCategorySubtype, LessonType } from '@erfar/shared'

type Scope = 'internal' | 'national'

interface Match {
  lesson_id: string
  project_id: string
  type: LessonType
  title: string
  description: string | null
  construction_phase: string
  created_at: string
  relevance: number
  is_own_company: boolean
  company_name: string | null
  review_notes: string | null
  solution: string | null
  tags: string[] | null
}

export default function SimilarLessons({
  projectId,
  categoryType,
  categorySubtype,
  justCreated,
}: {
  projectId: string
  categoryType: ProjectCategoryType
  categorySubtype: ProjectCategorySubtype
  justCreated?: boolean
}) {
  const supabase = createClient()
  const router = useRouter()
  const [scope, setScope] = useState<Scope>('internal')
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [visibleTypes, setVisibleTypes] = useState<Set<LessonType>>(new Set(['challenge', 'success']))
  const [highlight, setHighlight] = useState(!!justCreated)
  const [selected, setSelected] = useState<Match | null>(null)

  const load = useCallback(async (s: Scope) => {
    setLoading(true)
    setError('')
    const { data, error: rpcError } = await supabase.rpc('search_lessons_for_project', {
      p_category_type: categoryType,
      p_category_subtype: categorySubtype,
      p_scope: s,
      p_exclude_project_id: projectId,
    })
    if (rpcError) { setError(rpcError.message); setLoading(false); return }
    setMatches(data ?? [])
    setLoading(false)
  }, [categoryType, categorySubtype, projectId])

  useEffect(() => { load(scope) }, [scope, load])

  // First visit right after creating the project: strip ?new=1 from the URL
  // immediately (so a refresh doesn't re-trigger it) and fade the highlight
  // out on its own after a few seconds.
  useEffect(() => {
    if (!justCreated) return
    router.replace(`/projects/${projectId}`, { scroll: false })
    const timer = setTimeout(() => setHighlight(false), 4000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  function toggleType(t: LessonType) {
    setHighlight(false)
    setVisibleTypes(prev => {
      const next = new Set(prev)
      if (next.has(t)) {
        if (next.size > 1) next.delete(t) // keep at least one type visible
      } else {
        next.add(t)
      }
      return next
    })
  }

  const visibleMatches = useMemo(
    () => matches.filter(m => visibleTypes.has(m.type)),
    [matches, visibleTypes]
  )

  const categoryTypeLabel = PROJECT_CATEGORY_TYPES.find(c => c.value === categoryType)?.label ?? categoryType
  const categorySubtypeLabel = PROJECT_CATEGORY_SUBTYPES.find(c => c.value === categorySubtype)?.label ?? categorySubtype

  return (
    <div
      className={`bg-white border rounded-xl p-5 space-y-4 transition-all duration-700 ${
        highlight ? 'border-orange-400 ring-4 ring-orange-100' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-semibold text-lg">Liknande lärdomar</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {highlight
              ? 'Nytt projekt startat — här är vad andra har lärt sig om liknande projekt.'
              : `Baserat på ${categoryTypeLabel} · ${categorySubtypeLabel}`}
          </p>
        </div>
        <div className="flex border border-gray-200 rounded-lg overflow-hidden text-sm">
          <button
            onClick={() => { setHighlight(false); setScope('internal') }}
            className={`px-3 py-1.5 font-medium transition ${scope === 'internal' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Internt
          </button>
          <button
            onClick={() => { setHighlight(false); setScope('national') }}
            className={`px-3 py-1.5 font-medium transition ${scope === 'national' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Nationellt
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {LESSON_TYPES.map(t => {
          const active = visibleTypes.has(t.value)
          return (
            <button
              key={t.value}
              onClick={() => toggleType(t.value)}
              aria-pressed={active}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition ${
                active
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t.icon} {t.label}
            </button>
          )
        })}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading && <p className="text-gray-400 text-sm">Söker...</p>}

      {!loading && visibleMatches.length === 0 && (
        <p className="text-gray-400 text-sm">
          {matches.length > 0
            ? 'Inga lärdomar av den valda typen bland träffarna.'
            : scope === 'internal'
              ? 'Inga liknande lärdomar hittades i era egna projekt än.'
              : 'Inga liknande lärdomar hittades nationellt än.'}
        </p>
      )}

      <div className="space-y-2">
        {visibleMatches.map(m => {
          const typeInfo = LESSON_TYPES.find(t => t.value === m.type)!
          const phaseInfo = CONSTRUCTION_PHASES.find(p => p.value === m.construction_phase)
          return (
            <button
              key={m.lesson_id}
              type="button"
              onClick={() => setSelected(m)}
              className="w-full text-left block border border-gray-100 rounded-lg p-3 hover:border-orange-300 transition"
            >
              <div className="flex items-start gap-2">
                <span className="text-base leading-none mt-0.5">{typeInfo.icon}</span>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{m.title}</p>
                  {m.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{m.description}</p>}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {phaseInfo && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{phaseInfo.label}</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {m.is_own_company ? m.company_name : 'Annat företag'}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <span className="text-xl leading-none">{LESSON_TYPES.find(t => t.value === selected.type)!.icon}</span>
                <h3 className="text-lg font-bold">{selected.title}</h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Stäng"
              >
                ×
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {CONSTRUCTION_PHASES.find(p => p.value === selected.construction_phase) && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {CONSTRUCTION_PHASES.find(p => p.value === selected.construction_phase)!.label}
                </span>
              )}
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {selected.is_own_company ? selected.company_name : 'Annat företag'}
              </span>
            </div>

            {selected.description && (
              <p className="text-gray-700 whitespace-pre-wrap">{selected.description}</p>
            )}

            {selected.tags && selected.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.tags.map(tag => (
                  <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            )}

            {selected.review_notes && (
              <div>
                <p className="text-gray-400 text-sm mb-1">Ytterligare information</p>
                <p className="text-gray-700 whitespace-pre-wrap">{selected.review_notes}</p>
              </div>
            )}

            {selected.solution && (
              <div>
                <p className="text-gray-400 text-sm mb-1">Lösning</p>
                <p className="text-gray-700 whitespace-pre-wrap">{selected.solution}</p>
              </div>
            )}

            {selected.is_own_company && (
              <Link
                href={`/projects/${selected.project_id}/lessons/${selected.lesson_id}`}
                className="inline-block text-sm text-orange-700 font-semibold hover:underline"
              >
                Öppna i projektet →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
