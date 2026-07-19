'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LESSON_TYPES, CONSTRUCTION_PHASES, PROJECT_CATEGORY_TYPES, PROJECT_CATEGORY_SUBTYPES } from '@erfar/shared'
import type { ProjectCategoryType, ProjectCategorySubtype } from '@erfar/shared'

type Scope = 'internal' | 'national'

interface Match {
  lesson_id: string
  project_id: string
  type: 'challenge' | 'success'
  title: string
  description: string | null
  construction_phase: string
  created_at: string
  relevance: number
  is_own_company: boolean
  company_name: string | null
}

export default function SimilarLessons({
  projectId,
  categoryType,
  categorySubtype,
}: {
  projectId: string
  categoryType: ProjectCategoryType
  categorySubtype: ProjectCategorySubtype
}) {
  const supabase = createClient()
  const [scope, setScope] = useState<Scope>('internal')
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const categoryTypeLabel = PROJECT_CATEGORY_TYPES.find(c => c.value === categoryType)?.label ?? categoryType
  const categorySubtypeLabel = PROJECT_CATEGORY_SUBTYPES.find(c => c.value === categorySubtype)?.label ?? categorySubtype

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-semibold text-lg">Liknande lärdomar</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Baserat på {categoryTypeLabel} · {categorySubtypeLabel}
          </p>
        </div>
        <div className="flex border border-gray-200 rounded-lg overflow-hidden text-sm">
          <button
            onClick={() => setScope('internal')}
            className={`px-3 py-1.5 font-medium transition ${scope === 'internal' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Internt
          </button>
          <button
            onClick={() => setScope('national')}
            className={`px-3 py-1.5 font-medium transition ${scope === 'national' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Nationellt
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading && <p className="text-gray-400 text-sm">Söker...</p>}

      {!loading && matches.length === 0 && (
        <p className="text-gray-400 text-sm">
          {scope === 'internal'
            ? 'Inga liknande lärdomar hittades i era egna projekt än.'
            : 'Inga liknande lärdomar hittades nationellt än.'}
        </p>
      )}

      <div className="space-y-2">
        {matches.map(m => {
          const typeInfo = LESSON_TYPES.find(t => t.value === m.type)!
          const phaseInfo = CONSTRUCTION_PHASES.find(p => p.value === m.construction_phase)
          const content = (
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
          )
          return m.is_own_company ? (
            <Link
              key={m.lesson_id}
              href={`/projects/${m.project_id}/lessons/${m.lesson_id}`}
              className="block border border-gray-100 rounded-lg p-3 hover:border-orange-300 transition"
            >
              {content}
            </Link>
          ) : (
            <div key={m.lesson_id} className="border border-gray-100 rounded-lg p-3">
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}
