'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import SearchFilters from '@/components/SearchFilters'
import LessonCard from '@/components/LessonCard'
import type { Lesson, LessonType, Project, ProjectCategoryType, ProjectCategorySubtype, Tag } from '@erfar/shared'

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

  useEffect(() => {
    supabase.from('projects').select('*').then(({ data }) => setProjects(data ?? []))
    supabase.from('tags').select('*').then(({ data }) => setAllTags(data ?? []))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('lessons')
      .select('*, project:projects(*), tags:lesson_tags(tag:tags(*)), images:lesson_images(*)')
      .order('created_at', { ascending: false })

    if (query.trim()) q = q.textSearch('search_vector', query.trim(), { type: 'websearch', config: 'swedish' })
    if (type !== 'all') q = q.eq('type', type)
    if (projectId !== 'all') q = q.eq('project_id', projectId)

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
  }, [query, type, projectId, tag, categoryType, categorySubtype])

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
