'use client'

import { LESSON_TYPES, PROJECT_CATEGORY_TYPES, PROJECT_CATEGORY_SUBTYPES, CONSTRUCTION_PHASES } from '@erfar/shared'
import type { LessonType, Project, ProjectCategoryType, ProjectCategorySubtype, ConstructionPhase } from '@erfar/shared'

interface SearchFiltersProps {
  query: string
  onQueryChange: (q: string) => void
  type: LessonType | 'all'
  onTypeChange: (t: LessonType | 'all') => void
  tag: string | null
  onTagChange: (t: string | null) => void
  availableTags: string[]
  projectId: string | 'all'
  onProjectChange: (p: string | 'all') => void
  projects: Project[]
  categoryType: ProjectCategoryType | 'all'
  onCategoryTypeChange: (c: ProjectCategoryType | 'all') => void
  categorySubtype: ProjectCategorySubtype | 'all'
  onCategorySubtypeChange: (c: ProjectCategorySubtype | 'all') => void
  constructionPhase: ConstructionPhase | 'all'
  onConstructionPhaseChange: (c: ConstructionPhase | 'all') => void
}

export default function SearchFilters({
  query, onQueryChange,
  type, onTypeChange,
  tag, onTagChange, availableTags,
  projectId, onProjectChange, projects,
  categoryType, onCategoryTypeChange,
  categorySubtype, onCategorySubtypeChange,
  constructionPhase, onConstructionPhaseChange,
}: SearchFiltersProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <input
        type="text"
        value={query}
        onChange={e => onQueryChange(e.target.value)}
        placeholder="Sök i alla lärdomar..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex flex-wrap gap-3">
        <select value={type} onChange={e => onTypeChange(e.target.value as LessonType | 'all')}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <option value="all">Alla typer</option>
          {LESSON_TYPES.map(lt => (
            <option key={lt.value} value={lt.value}>{lt.icon} {lt.label}</option>
          ))}
        </select>
        <select value={projectId} onChange={e => onProjectChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <option value="all">Alla projekt</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select value={constructionPhase} onChange={e => onConstructionPhaseChange(e.target.value as ConstructionPhase | 'all')}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <option value="all">Var i byggprocessen (alla)</option>
          {CONSTRUCTION_PHASES.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <select value={categoryType} onChange={e => onCategoryTypeChange(e.target.value as ProjectCategoryType | 'all')}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <option value="all">Alla projekttyper</option>
          {PROJECT_CATEGORY_TYPES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select value={categorySubtype} onChange={e => onCategorySubtypeChange(e.target.value as ProjectCategorySubtype | 'all')}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <option value="all">Alla kategorier</option>
          {PROJECT_CATEGORY_SUBTYPES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTags.map(t => (
            <button key={t} type="button"
              onClick={() => onTagChange(tag === t ? null : t)}
              className={`text-xs px-2 py-1 rounded-full border transition ${
                tag === t ? 'bg-orange-600 text-white border-orange-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
