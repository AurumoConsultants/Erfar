import { useCallback, useState } from 'react'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { t } from '@/lib/i18n'
import { LESSON_TYPES } from '@erfar/shared'
import type { Lesson } from '@erfar/shared'

export default function LessonDetailScreen() {
  const { lessonId } = useLocalSearchParams<{ id: string; lessonId: string }>()
  const tr = t()

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!lessonId) return

    const { data } = await supabase
      .from('lessons')
      .select('*, author:profiles(*), tags:lesson_tags(tag:tags(*)), images:lesson_images(*)')
      .eq('id', lessonId)
      .single()

    if (data) {
      const normalized: Lesson = {
        ...data,
        tags: (data.tags ?? []).map((lt: any) => lt.tag).filter(Boolean),
        images: data.images ?? [],
      }
      setLesson(normalized)

      if (normalized.images && normalized.images.length > 0) {
        const paths = normalized.images.map((img) => img.storage_path)
        const { data: signed } = await supabase.storage
          .from('lesson-images')
          .createSignedUrls(paths, 3600)
        setImageUrls((signed ?? []).map((s) => s.signedUrl).filter(Boolean) as string[])
      } else {
        setImageUrls([])
      }
    }

    setLoading(false)
  }, [lessonId])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  if (loading || !lesson) {
    return (
      <View style={styles.center}>
        <Text>{tr.common.loading}</Text>
      </View>
    )
  }

  const meta = LESSON_TYPES.find((lt) => lt.value === lesson.type)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.typeRow}>
        <Text style={styles.icon}>{meta?.icon}</Text>
        <Text style={[styles.typeLabel, { color: meta?.color }]}>{tr.lesson.types[lesson.type]}</Text>
      </View>

      <Text style={styles.title}>{lesson.title}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{lesson.author?.full_name ?? ''}</Text>
        <Text style={styles.metaText}>{new Date(lesson.created_at).toLocaleDateString('sv-SE')}</Text>
      </View>

      {lesson.tags && lesson.tags.length > 0 ? (
        <View style={styles.tagRow}>
          {lesson.tags.map((tag) => (
            <View key={tag.id} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag.name}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {lesson.description ? <Text style={styles.description}>{lesson.description}</Text> : null}

      {imageUrls.length > 0 ? (
        <View style={styles.photoRow}>
          {imageUrls.map((url) => (
            <Image key={url} source={{ uri: url }} style={styles.photo} resizeMode="cover" />
          ))}
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 18,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tagChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 13,
    color: '#374151',
  },
  description: {
    fontSize: 15,
    color: '#374151',
    marginTop: 16,
    lineHeight: 22,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
  },
  photo: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
})
