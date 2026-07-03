'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'

interface InvitationInfo {
  email: string
  role: 'entrepreneur' | 'spectator_project' | 'spectator_company' | 'konsult'
  company: { id: string; name: string } | null
  project: { id: string; name: string; location: string | null } | null
}

const roleLabelKey = {
  entrepreneur: 'roleEntrepreneur',
  spectator_project: 'roleSpectatorProject',
  spectator_company: 'roleSpectatorCompany',
  konsult: 'roleKonsult',
} as const

export default function InvitePage() {
  const { t } = useI18n()
  const params = useParams()
  const token = params.token as string
  const supabase = createClient()

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [isNewUser, setIsNewUser] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (token) loadInvitation()
  }, [token])

  async function loadInvitation() {
    const res = await fetch(`/api/invite/${token}`)
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? t.invite.invalidOrUsed); setLoading(false); return }
    setInvitation(json)
    setLoading(false)
  }

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault()
    if (!invitation) return
    setSaving(true)
    setError('')

    const res = await fetch('/api/accept-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        email: invitation.email,
        password,
        fullName,
        isNewUser,
      }),
    })
    const json = await res.json()

    if (!res.ok) { setError(json.error); setSaving(false); return }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: invitation.email,
      password,
    })

    if (loginError) { setError(loginError.message); setSaving(false); return }

    window.location.href = json.projectId ? `/projects/${json.projectId}` : '/dashboard'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">{t.common.loading}</p>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-6 text-center">
          <p className="text-blue-700 font-bold text-2xl mb-2">Erfar</p>
          <h1 className="text-xl font-bold">
            Du har blivit inbjuden som {t.invite[roleLabelKey[invitation!.role]]}
          </h1>
          {invitation!.project ? (
            <>
              <p className="text-gray-500 text-sm mt-1">
                Projekt: <strong>{invitation!.project.name}</strong>
              </p>
              {invitation!.project.location && (
                <p className="text-gray-400 text-xs mt-0.5">{invitation!.project.location}</p>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-sm mt-1">
              Företag: <strong>{invitation!.company?.name}</strong>
            </p>
          )}
          <p className="text-gray-400 text-xs mt-2">
            Inbjudan skickad till: <strong>{invitation!.email}</strong>
          </p>
        </div>

        <div className="flex gap-2 mb-5">
          <button onClick={() => setIsNewUser(true)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${isNewUser ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Skapa konto
          </button>
          <button onClick={() => setIsNewUser(false)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${!isNewUser ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Logga in
          </button>
        </div>

        <form onSubmit={handleAccept} className="space-y-4">
          {isNewUser && (
            <div>
              <label className="block text-sm font-medium mb-1">{t.auth.fullName}</label>
              <input required value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">{t.auth.password}</label>
            <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={saving}
            className="w-full bg-blue-700 text-white py-2 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50 transition">
            {saving ? 'Bearbetar...' : t.invite.accept}
          </button>
        </form>
      </div>
    </div>
  )
}
