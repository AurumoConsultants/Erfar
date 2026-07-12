'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import SearchFilters from '@/components/SearchFilters'
import LessonCard from '@/components/LessonCard'
import type { Lesson, LessonType, Project, ProjectCategoryType, ProjectCategorySubtype, ConstructionPhase, Tag } from '@erfar/shared'

export default function KnowledgeBasePage() {
  const supabase = createClient()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [type, setType] = useState<LessonType | 'all'>('all')
  const [tag, setTag] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | 'all'>('all')
  const [categoryType, setCategoryType] = useState<ProjectCategoryType | 'all'>('all')
  const [categorySubtype, setCategorySubtype] = useState<ProjectCategorySubtype | 'all'>('all')
  const [constructionPhase, setConstructionPhase] = useState<ConstructionPhase | 'all'>('all')

  useEffect(() => {
    supabase.from('projects').select('*').then(({ data }) => setProjects(data ?? []))
    // Only freeform tags — work_type/building_part categories share this same
    // table (different `kind`) but have their own dedicated filter/display.
    supabase.from('tags').select('*').eq('kind', 'tag').then(({ data }) => setAllTags(data ?? []))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('lessons')
      .select('*, project:projects(*), tags:lesson_tags(tag:tags(*)), images:lesson_images(*)')
      // Only lessons that came out of a review meeting are "official" — drafts
      // stay visible on their own project page but don't surface here.
      .not('reviewed_at', 'is', null)
      .order('created_at', { ascending: false })

    if (query.trim()) q = q.textSearch('search_vector', query.trim(), { type: 'websearch', config: 'swedish' })
    if (type !== 'all') q = q.eq('type', type)
    if (projectId !== 'all') q = q.eq('project_id', projectId)
    if (constructionPhase !== 'all') q = q.eq('construction_phase', constructionPhase)

    const { data } = await q
    let rows: Lesson[] = (data ?? []).map((l: any) => ({
      ...l,
      tags: (l.tags ?? []).map((lt: any) => lt.tag).filter(Boolean),
    }))
    if (tag) rows = rows.filter(l => l.tags?.some(t => t.name === tag))
    if (categoryType !== 'all') rows = rows.filter(l => l.project?.category_type === categoryType)
    if (categorySubtype !== 'all') rows = rows.filter(l => l.project?.category_subtype === categorySubtype)

    setLessons(rows)
    setLoading(false)
  }, [query, type, projectId, tag, categoryType, categorySubtype, constructionPhase])

  useEffect(() => { load() }, [load])

  const availableTags = useMemo(() => Array.from(new Set(allTags.map(t => t.name))), [allTags])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kunskapsbank</h1>

      <SearchFilters
        query={query} onQueryChange={setQuery}
        type={type} onTypeChange={setType}
        tag={tag} onTagChange={setTag}
        availableTags={availableTags}
        projectId={projectId} onProjectChange={setProjectId}
        projects={projects}
        categoryType={categoryType} onCategoryTypeChange={setCategoryType}
        categorySubtype={categorySubtype} onCategorySubtypeChange={setCategorySubtype}
        constructionPhase={constructionPhase} onConstructionPhaseChange={setConstructionPhase}
      />

      <div className="space-y-3">
        {lessons.map(l => <LessonCard key={l.id} lesson={l} showProject />)}
        {!loading && lessons.length === 0 && (
          <p className="text-gray-400 text-sm">Inga lärdomar hittades</p>
        )}
      </div>
    </div>
  )
}
