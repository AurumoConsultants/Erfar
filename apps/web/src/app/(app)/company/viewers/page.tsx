'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CompanyViewer, Invitation } from '@erfar/shared'

export default function CompanyViewersPage() {
  const supabase = createClient()
  const [viewers, setViewers] = useState<CompanyViewer[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [email, setEmail] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    const { data: viewerRows } = await supabase.from('company_viewers').select('*, profile:profiles(*)')
    setViewers(viewerRows ?? [])

    const { data: inviteRows } = await supabase
      .from('invitations')
      .select('*')
      .eq('role', 'spectator_company')
      .is('accepted_at', null)
    setInvitations(inviteRows ?? [])
  }, [])

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
      body: JSON.stringify({ email, role: 'spectator_company' }),
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

  async function handleRemove(id: string) {
    if (!confirm('Ta bort åtkomst för denna åskådare?')) return
    await supabase.from('company_viewers').delete().eq('id', id)
    load()
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Åskådare (företag)</h1>
        <p className="text-gray-500 text-sm mt-1">
          Dessa personer kan läsa rapporter och lärdomar från alla era projekt, men kan inte lägga till något själva.
        </p>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Nuvarande åskådare</h2>
        <div className="space-y-2">
          {viewers.map(v => (
            <div key={v.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{v.profile?.full_name}</p>
                <p className="text-xs text-gray-400">{v.profile?.email}</p>
              </div>
              <button onClick={() => handleRemove(v.id)} className="text-sm text-red-600 hover:underline">Ta bort</button>
            </div>
          ))}
          {viewers.length === 0 && <p className="text-gray-400 text-sm">Inga åskådare än.</p>}
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Bjud in åskådare</h2>
        <form onSubmit={handleInvite} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">E-post</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
            className="w-full bg-orange-600 text-white font-semibold py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition">
            {sending ? 'Skickar...' : 'Skicka inbjudan'}
          </button>
        </form>
      </div>

      {invitations.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Väntande inbjudningar</h2>
          <div className="space-y-2">
            {invitations.map(inv => (
              <div key={inv.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-sm">{inv.email}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
