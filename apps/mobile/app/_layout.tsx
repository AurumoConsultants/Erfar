import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Redirect, Stack } from 'expo-router'
import { initLocale } from '@/lib/i18n'
import { AuthProvider, useAuth } from '@/lib/auth'

function RootNavigator() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    )
  }

  return (
    <>
      {!session && <Redirect href="/(auth)/login" />}
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initLocale().then(() => setReady(true))
  }, [])

  if (!ready) return null

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
