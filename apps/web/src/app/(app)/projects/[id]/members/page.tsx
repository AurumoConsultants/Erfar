'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ProjectMember, Invitation } from '@erfar/shared'

export default function ProjectMembersPage() {
  const params = useParams()
  const projectId = params.id as string
  const supabase = createClient()

  const [members, setMembers] = useState<ProjectMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'entrepreneur' | 'spectator_project'>('entrepreneur')
  const [inviteUrl, setInviteUrl] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    const { data: memberRows } = await supabase
      .from('project_members')
      .select('*, profile:profiles(*)')
      .eq('project_id', projectId)
    setMembers(memberRows ?? [])

    const { data: inviteRows } = await supabase
      .from('invitations')
      .select('*')
      .eq('project_id', projectId)
      .is('accepted_at', null)
    setInvitations(inviteRows ?? [])
  }, [projectId, supabase])

  useEffect(() => { load() }, [load])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    setInviteUrl('')
    setEmailSent(false)
    setEmailError('')

    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, email, role }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error); setSending(false); return }

    setInviteUrl(json.inviteUrl)
    setEmailSent(!!json.emailSent)
    setEmailError(json.emailSent ? '' : json.emailError ?? '')
    setEmail('')
    setSending(false)
    load()
  }

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="text-2xl font-bold">Medlemmar</h1>

      <div>
        <h2 className="font-semibold mb-3">Nuvarande medlemmar</h2>
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{m.profile?.full_name}</p>
                <p className="text-xs text-gray-400">{m.profile?.email}</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{m.role}</span>
            </div>
          ))}
          {members.length === 0 && <p className="text-gray-400 text-sm">Inga medlemmar än.</p>}
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Bjud in</h2>
        <form onSubmit={handleInvite} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">E-post</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Roll</label>
            <select value={role} onChange={e => setRole(e.target.value as typeof role)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="entrepreneur">Entreprenör</option>
              <option value="spectator_project">Åskådare (endast detta projekt)</option>
            </select>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {inviteUrl && (
            <div className="text-sm bg-green-50 rounded-lg p-2 space-y-1">
              {emailSent ? (
                <p className="text-green-700">✓ Inbjudan skickad via e-post.</p>
              ) : (
                <p className="text-amber-700">
                  Kunde inte skicka e-post{emailError ? ` (${emailError})` : ''}. Dela länken manuellt istället:
                </p>
              )}
              <p className="text-green-700 break-all">{inviteUrl}</p>
            </div>
          )}
          <button type="submit" disabled={sending}
            className="w-full bg-blue-700 text-white font-semibold py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition">
            {sending ? 'Skickar...' : 'Skicka inbjudan'}
          </button>
        </form>
      </div>

      {invitations.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Väntande inbjudningar</h2>
          <div className="space-y-2">
            {invitations.map(inv => (
              <div key={inv.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
                <p className="text-sm">{inv.email}</p>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full capitalize">{inv.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
