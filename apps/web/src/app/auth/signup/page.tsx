'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'

// Signup is client-only: it creates a company owned by the signing-up user
// (role 'client'). Entrepreneurs and spectators never see this page — they
// only join via an /invite/[token] link sent by a client.
export default function SignupPage() {
  const { t } = useI18n()
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [orgNumber, setOrgNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, companyName, orgNumber }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Registrering misslyckades.'); setLoading(false); return }

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (loginError) { setError(loginError.message); setLoading(false); return }

    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <p className="text-blue-700 font-bold text-2xl mb-6 text-center">Erfar</p>
        <h1 className="text-2xl font-bold mb-2">{t.auth.signup}</h1>
        <p className="text-gray-500 text-sm mb-6">
          Skapar ett företagskonto. Bjud in entreprenörer och åskådare från projektsidan efteråt.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t.auth.fullName}</label>
            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.auth.companyName}</label>
            <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.auth.orgNumber}</label>
            <input type="text" value={orgNumber} onChange={e => setOrgNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.auth.email}</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.auth.password}</label>
            <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-700 text-white font-semibold py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition">
            {loading ? t.common.loading : t.auth.signup}
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-500">
          <Link href="/auth/login" className="text-blue-700 hover:underline">{t.auth.hasAccount}</Link>
        </p>
      </div>
    </div>
  )
}
