import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { t } from '@/lib/i18n'
import { LESSON_TYPES, SUGGESTED_TAGS, CONSTRUCTION_PHASES } from '@erfar/shared'
import type { LessonType, ConstructionPhase } from '@erfar/shared'

export default function NewLessonScreen() {
  const { id: projectId } = useLocalSearchParams<{ id: string }>()
  const { profile } = useAuth()
  const tr = t()
  const router = useRouter()

  const [type, setType] = useState<LessonType>('challenge')
  const [constructionPhase, setConstructionPhase] = useState<ConstructionPhase>(CONSTRUCTION_PHASES[0].value)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function addTag(raw: string) {
    const name = raw.trim().toLowerCase()
    if (!name) return
    if (!tags.includes(name)) setTags([...tags, name])
    setTagInput('')
  }

  function removeTag(name: string) {
    setTags(tags.filter((tg) => tg !== name))
  }

  function handleTagInputSubmit() {
    // support comma-separated entry
    tagInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => addTag(s))
    setTagInput('')
  }

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert(tr.common.error)
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: true,
    })
    if (!result.canceled) {
      setPhotos([...photos, ...result.assets])
    }
  }

  function removePhoto(uri: string) {
    setPhotos(photos.filter((p) => p.uri !== uri))
  }

  async function handleSubmit() {
    if (!title.trim() || !projectId || !profile) return
    setSubmitting(true)
    setError('')

    try {
      // 1. Look up the project's company_id (tags are namespaced per company)
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('company_id')
        .eq('id', projectId)
        .single()
      if (projectError || !project) throw new Error(projectError?.message ?? 'Project not found')

      // 2. Insert the lesson
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          project_id: projectId,
          type,
          construction_phase: constructionPhase,
          title: title.trim(),
          description: description.trim() || null,
          created_by: profile.id,
        })
        .select()
        .single()
      if (lessonError || !lesson) throw new Error(lessonError?.message ?? 'Insert failed')

      // 3. Resolve tags: find-or-create per company, then link via lesson_tags
      if (tags.length > 0) {
        for (const tagName of tags) {
          let tagId: string | undefined

          const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('company_id', project.company_id)
            .eq('name', tagName)
            .maybeSingle()

          if (existingTag) {
            tagId = existingTag.id
          } else {
            const { data: newTag, error: newTagError } = await supabase
              .from('tags')
              .insert({ company_id: project.company_id, name: tagName })
              .select('id')
              .single()
            if (newTagError) throw new Error(newTagError.message)
            tagId = newTag?.id
          }

          if (tagId) {
            await supabase.from('lesson_tags').insert({ lesson_id: lesson.id, tag_id: tagId })
          }
        }
      }

      // 4. Upload photos to storage, then insert lesson_images rows
      for (const photo of photos) {
        const filename = photo.fileName ?? `${Date.now()}.jpg`
        const storagePath = `${projectId}/${lesson.id}/${filename}`

        const base64 = await FileSystem.readAsStringAsync(photo.uri, {
          encoding: FileSystem.EncodingType.Base64,
        })
        const arrayBuffer = decodeBase64(base64)

        const { error: uploadError } = await supabase.storage
          .from('lesson-images')
          .upload(storagePath, arrayBuffer, {
            contentType: photo.mimeType ?? 'image/jpeg',
          })
        if (uploadError) throw new Error(uploadError.message)

        await supabase.from('lesson_images').insert({
          lesson_id: lesson.id,
          storage_path: storagePath,
        })
      }

      router.replace(`/(app)/projects/${projectId}/lesson/${lesson.id}`)
    } catch (e: any) {
      setError(e?.message ?? tr.common.error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>{tr.lesson.type}</Text>
      <View style={styles.typeRow}>
        {LESSON_TYPES.map((lt) => (
          <TouchableOpacity
            key={lt.value}
            style={[
              styles.typeButton,
              type === lt.value && { backgroundColor: lt.color, borderColor: lt.color },
            ]}
            onPress={() => setType(lt.value)}
          >
            <Text style={[styles.typeButtonText, type === lt.value && styles.typeButtonTextActive]}>
              {lt.icon} {tr.lesson.types[lt.value]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Var i byggprocessen</Text>
      <View style={styles.phaseRow}>
        {CONSTRUCTION_PHASES.map((p) => (
          <TouchableOpacity
            key={p.value}
            style={[styles.phaseButton, constructionPhase === p.value && styles.phaseButtonActive]}
            onPress={() => setConstructionPhase(p.value)}
          >
            <Text style={[styles.phaseButtonText, constructionPhase === p.value && styles.typeButtonTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{tr.lesson.lessonTitle}</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>{tr.lesson.description}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>{tr.lesson.tags}</Text>
      <View style={styles.tagRow}>
        {tags.map((tagName) => (
          <TouchableOpacity key={tagName} style={styles.tagChip} onPress={() => removeTag(tagName)}>
            <Text style={styles.tagText}>{tagName} ×</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={tagInput}
        onChangeText={setTagInput}
        onSubmitEditing={handleTagInputSubmit}
        placeholder={tr.lesson.addTag}
        returnKeyType="done"
      />
      <View style={styles.suggestedRow}>
        {SUGGESTED_TAGS.filter((s) => !tags.includes(s)).map((suggestion) => (
          <TouchableOpacity key={suggestion} style={styles.suggestedChip} onPress={() => addTag(suggestion)}>
            <Text style={styles.suggestedText}>+ {suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{tr.lesson.addPhoto}</Text>
      <View style={styles.photoRow}>
        {photos.map((photo) => (
          <TouchableOpacity key={photo.uri} onPress={() => removePhoto(photo.uri)}>
            <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.addPhotoButton} onPress={pickPhoto}>
          <Text style={styles.addPhotoText}>+</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.submitButton, (submitting || !title.trim()) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting || !title.trim()}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{tr.common.save}</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

// expo-file-system's base64 string -> ArrayBuffer for supabase-js upload
function decodeBase64(base64: string): ArrayBuffer {
  const binaryString = globalThis.atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  phaseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  phaseButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  phaseButtonActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  phaseButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  tagChip: {
    backgroundColor: '#dbeafe',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  suggestedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  suggestedChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  suggestedText: {
    fontSize: 12,
    color: '#6b7280',
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  addPhotoButton: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 28,
    color: '#9ca3af',
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
    marginTop: 16,
  },
  submitButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
})
