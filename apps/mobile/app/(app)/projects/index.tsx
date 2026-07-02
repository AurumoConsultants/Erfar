import { useCallback, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { t } from '@/lib/i18n'
import type { Project } from '@erfar/shared'

export default function ProjectsListScreen() {
  const tr = t()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setProjects(data ?? [])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  function onRefresh() {
    setRefreshing(true)
    load()
  }

  const statusLabel = (status: Project['status']) => tr.project.statuses[status] ?? status

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>{tr.common.loading}</Text>
      </View>
    )
  }

  return (
    <FlatList
      style={styles.container}
      data={projects}
      keyExtractor={(item) => item.id}
      contentContainerStyle={projects.length === 0 && styles.emptyContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={<Text style={styles.emptyText}>{tr.knowledgeBase.noResults}</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/(app)/projects/${item.id}`)}
        >
          <Text style={styles.name}>{item.name}</Text>
          {item.location ? <Text style={styles.meta}>{item.location}</Text> : null}
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{statusLabel(item.status)}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
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
  name: {
    fontSize: 17,
    fontWeight: '600',
  },
  meta: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '600',
  },
})
