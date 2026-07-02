import { useCallback, useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { t } from '@/lib/i18n'
import { LESSON_TYPES } from '@erfar/shared'
import type { Lesson, LessonType } from '@erfar/shared'

export default function KnowledgeBaseScreen() {
  const tr = t()
  const router = useRouter()

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<LessonType | null>(null)
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [allTags, setAllTags] = useState<string[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('lessons')
      .select('*, project:projects(*), author:profiles(*), tags:lesson_tags(tag:tags(*))')
      .order('created_at', { ascending: false })

    if (query.trim()) {
      q = q.ilike('title', `%${query.trim()}%`)
    }
    if (typeFilter) {
      q = q.eq('type', typeFilter)
    }

    const { data, error } = await q
    if (!error) {
      let normalized: Lesson[] = (data ?? []).map((l: any) => ({
        ...l,
        tags: (l.tags ?? []).map((lt: any) => lt.tag).filter(Boolean),
      }))

      if (tagFilter) {
        normalized = normalized.filter((l) => l.tags?.some((tg) => tg.name === tagFilter))
      }

      setLessons(normalized)
      const tagSet = new Set<string>()
      normalized.forEach((l) => l.tags?.forEach((tg) => tagSet.add(tg.name)))
      setAllTags(Array.from(tagSet).sort())
    }
    setLoading(false)
  }, [query, typeFilter, tagFilter])

  useEffect(() => {
    const timeout = setTimeout(load, 300)
    return () => clearTimeout(timeout)
  }, [load])

  function lessonTypeMeta(type: Lesson['type']) {
    return LESSON_TYPES.find((lt) => lt.value === type)
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder={tr.knowledgeBase.searchPlaceholder}
        value={query}
        onChangeText={setQuery}
      />

      <View style={styles.filterRow}>
        {LESSON_TYPES.map((lt) => (
          <TouchableOpacity
            key={lt.value}
            style={[styles.filterChip, typeFilter === lt.value && styles.filterChipActive]}
            onPress={() => setTypeFilter(typeFilter === lt.value ? null : lt.value)}
          >
            <Text style={[styles.filterChipText, typeFilter === lt.value && styles.filterChipTextActive]}>
              {lt.icon} {tr.lesson.types[lt.value]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {allTags.length > 0 && (
        <FlatList
          horizontal
          data={allTags}
          keyExtractor={(tag) => tag}
          style={styles.tagFilterRow}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item: tag }) => (
            <TouchableOpacity
              style={[styles.filterChip, tagFilter === tag && styles.filterChipActive]}
              onPress={() => setTagFilter(tagFilter === tag ? null : tag)}
            >
              <Text style={[styles.filterChipText, tagFilter === tag && styles.filterChipTextActive]}>
                {tag}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {loading ? (
        <View style={styles.center}>
          <Text>{tr.common.loading}</Text>
        </View>
      ) : (
        <FlatList
          data={lessons}
          keyExtractor={(item) => item.id}
          contentContainerStyle={lessons.length === 0 && styles.emptyContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>{tr.knowledgeBase.noResults}</Text>}
          renderItem={({ item }) => {
            const meta = lessonTypeMeta(item.type)
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/(app)/projects/${item.project_id}/lesson/${item.id}`)}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.icon}>{meta?.icon}</Text>
                  <Text style={styles.lessonTitle}>{item.title}</Text>
                </View>
                <Text style={styles.projectName}>{item.project?.name}</Text>
                {item.tags && item.tags.length > 0 ? (
                  <View style={styles.tagRow}>
                    {item.tags.map((tag) => (
                      <View key={tag.id} style={styles.tagChip}>
                        <Text style={styles.tagText}>{tag.name}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  tagFilterRow: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  filterChipText: {
    fontSize: 13,
    color: '#374151',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  emptyContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  projectName: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tagChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 12,
    color: '#374151',
  },
})
