import { useCallback, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { t } from '@/lib/i18n'
import { LESSON_TYPES } from '@erfar/shared'
import type { Lesson, Project } from '@erfar/shared'

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { profile } = useAuth()
  const tr = t()
  const router = useRouter()

  const [project, setProject] = useState<Project | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [canLog, setCanLog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!id) return

    const [{ data: projectData }, { data: lessonsData }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase
        .from('lessons')
        .select('*, author:profiles(*), tags:lesson_tags(tag:tags(*))')
        .eq('project_id', id)
        .order('created_at', { ascending: false }),
    ])

    setProject(projectData ?? null)
    setLessons(
      (lessonsData ?? []).map((l: any) => ({
        ...l,
        tags: (l.tags ?? []).map((lt: any) => lt.tag).filter(Boolean),
      }))
    )

    // "Log a lesson" is visible to: the owning client (company_id matches profile's
    // company), or an entrepreneur member of this project. Spectators never see it.
    let allowed = false
    if (profile?.role === 'client' && projectData && profile.company_id === projectData.company_id) {
      allowed = true
    } else if (profile) {
      const { data: membership } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', id)
        .eq('profile_id', profile.id)
        .eq('role', 'entrepreneur')
        .maybeSingle()
      allowed = !!membership
    }
    setCanLog(allowed)

    setLoading(false)
    setRefreshing(false)
  }, [id, profile])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  function onRefresh() {
    setRefreshing(true)
    load()
  }

  function lessonTypeMeta(type: Lesson['type']) {
    return LESSON_TYPES.find((lt) => lt.value === type)
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>{tr.common.loading}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          project ? (
            <View style={styles.header}>
              <Text style={styles.projectName}>{project.name}</Text>
              {project.location ? <Text style={styles.meta}>{project.location}</Text> : null}
              {project.description ? <Text style={styles.description}>{project.description}</Text> : null}
              <Text style={styles.sectionTitle}>{tr.lesson.title}</Text>
            </View>
          ) : null
        }
        contentContainerStyle={lessons.length === 0 && styles.emptyContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>{tr.knowledgeBase.noResults}</Text>}
        renderItem={({ item }) => {
          const meta = lessonTypeMeta(item.type)
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(app)/projects/${id}/lesson/${item.id}`)}
            >
              <View style={styles.cardTop}>
                <Text style={styles.icon}>{meta?.icon}</Text>
                <Text style={styles.lessonTitle}>{item.title}</Text>
              </View>
              {item.tags && item.tags.length > 0 ? (
                <View style={styles.tagRow}>
                  {item.tags.map((tag) => (
                    <View key={tag.id} style={styles.tagChip}>
                      <Text style={styles.tagText}>{tag.name}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <View style={styles.cardFooter}>
                <Text style={styles.footerText}>{item.author?.full_name ?? ''}</Text>
                <Text style={styles.footerText}>
                  {new Date(item.created_at).toLocaleDateString('sv-SE')}
                </Text>
              </View>
            </TouchableOpacity>
          )
        }}
      />

      {canLog && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push(`/(app)/projects/${id}/new-lesson`)}
        >
          <Text style={styles.fabText}>+ {tr.lesson.new}</Text>
        </TouchableOpacity>
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
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  projectName: {
    fontSize: 22,
    fontWeight: '700',
  },
  meta: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 24,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: '#1d4ed8',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
})
