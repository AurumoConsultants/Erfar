import { Stack } from 'expo-router'
import { t } from '@/lib/i18n'

export default function ProjectsLayout() {
  const tr = t()
  return (
    <Stack screenOptions={{ headerTintColor: '#1d4ed8' }}>
      <Stack.Screen name="index" options={{ title: tr.project.title }} />
      <Stack.Screen name="[id]/index" options={{ title: tr.project.title }} />
      <Stack.Screen name="[id]/new-lesson" options={{ title: tr.lesson.new }} />
      <Stack.Screen name="[id]/lesson/[lessonId]" options={{ title: tr.lesson.title }} />
    </Stack>
  )
}
