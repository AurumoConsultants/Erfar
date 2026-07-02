import { useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { t } from '@/lib/i18n'
import type { UserRole } from '@erfar/shared'

const ROLE_LABELS: Record<UserRole, string> = {
  client: 'Kund',
  entrepreneur: 'Entreprenör',
  spectator: 'Åskådare',
}

export default function ProfileScreen() {
  const { profile } = useAuth()
  const tr = t()
  const [companyName, setCompanyName] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.company_id) return
    supabase
      .from('companies')
      .select('name')
      .eq('id', profile.company_id)
      .single()
      .then(({ data }) => setCompanyName(data?.name ?? null))
  }, [profile?.company_id])

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (!profile) return null

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{profile.full_name}</Text>
        <Text style={styles.email}>{profile.email}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Roll</Text>
          <Text style={styles.value}>{ROLE_LABELS[profile.role]}</Text>
        </View>

        {companyName ? (
          <View style={styles.row}>
            <Text style={styles.label}>Företag</Text>
            <Text style={styles.value}>{companyName}</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>{tr.common.logout}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  logoutText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 15,
  },
})
