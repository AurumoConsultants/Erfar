import { Stack } from 'expo-router'
import { t } from '@/lib/i18n'

export default function ProfileLayout() {
  const tr = t()
  return (
    <Stack screenOptions={{ headerTintColor: '#1d4ed8' }}>
      <Stack.Screen name="index" options={{ title: tr.nav.settings }} />
    </Stack>
  )
}
