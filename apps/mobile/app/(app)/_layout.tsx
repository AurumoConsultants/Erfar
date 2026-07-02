import { Redirect, Tabs } from 'expo-router'
import { Text } from 'react-native'
import { useAuth } from '@/lib/auth'
import { t } from '@/lib/i18n'

export default function AppLayout() {
  const { session, loading } = useAuth()

  if (loading) return null
  if (!session) return <Redirect href="/(auth)/login" />

  const tr = t()

  return (
    <Tabs
      screenOptions={{
        headerTintColor: '#1d4ed8',
        tabBarActiveTintColor: '#1d4ed8',
      }}
    >
      <Tabs.Screen
        name="projects"
        options={{
          title: tr.nav.projects,
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size, color }}>📁</Text>,
        }}
      />
      <Tabs.Screen
        name="knowledge-base"
        options={{
          title: tr.nav.knowledgeBase,
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size, color }}>📚</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: tr.nav.settings,
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size, color }}>👤</Text>,
        }}
      />
    </Tabs>
  )
}
