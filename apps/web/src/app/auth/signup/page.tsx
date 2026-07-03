'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { SWEDISH_KOMMUNER } from '@erfar/shared'

type Step = 'choose' | 'private' | 'kommun'

// Signup is client-only: it creates a company owned by the signing-up user
// (role 'client'). Entrepreneurs and spectators never see this page — they
// only join via an /invite/[token] link sent by a client.
export default function SignupPage() {
  const { t } = useI18n()
  const supabase = createClient()
  const [step, setStep] = useState<Step>('choose')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // private company
  const [companyName, setCompanyName] = useState('')
  const [orgNumber, setOrgNumber] = useState('')

  // kommun
  const [kommun, setKommun] = useState('')
  const [bolagOrgNumber, setBolagOrgNumber] = useState('')
  const [bolagName, setBolagName] = useState('')
  const [searching, setSearching] = useState(false)
  const [lookupMessage, setLookupMessage] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSearchCompany() {
    setSearching(true)
    setLookupMessage('')
    try {
      const res = await fetch(`/api/company-lookup?orgNumber=${encodeURIComponent(bolagOrgNumber)}`)
      const json = await res.json()
      if (!res.ok) {
        setLookupMessage(json.error ?? t.auth.companyNotFound)
      } else if (!json.configured) {
        setLookupMessage(t.auth.lookupNotConfigured)
      } else if (json.name) {
        setBolagName(json.name)
      } else {
        setLookupMessage(json.error ?? t.auth.companyNotFound)
      }
    } catch {
      setLookupMessage(t.auth.companyNotFound)
    } finally {
      setSearching(false)
    }
  }

  async function handleSubmit(e: React.FormEvent, accountType: 'private_company' | 'kommun') {
    e.preventDefault()
    setLoading(true)
    setError('')

    const body =
      accountType === 'private_company'
        ? { email, password, fullName, companyName, orgNumber, accountType }
        : { email, password, fullName, companyName: bolagName, orgNumber: bolagOrgNumber, accountType, kommun }

    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Registrering misslyckades.'); setLoading(false); return }

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (loginError) { setError(loginError.message); setLoading(false); return }

    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <p className="text-blue-700 font-bold text-2xl mb-6 text-center">Erfar</p>
        <h1 className="text-2xl font-bold mb-2">{t.auth.signup}</h1>

        {step === 'choose' && (
          <>
            <p className="text-gray-500 text-sm mb-6">{t.auth.accountTypePrompt}</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setStep('private')}
                className="border border-gray-300 rounded-lg py-6 px-3 text-center font-semibold hover:bg-gray-50 hover:border-blue-400 transition">
                {t.auth.accountTypePrivate}
              </button>
              <button type="button" onClick={() => setStep('kommun')}
                className="border border-gray-300 rounded-lg py-6 px-3 text-center font-semibold hover:bg-gray-50 hover:border-blue-400 transition">
                {t.auth.accountTypeKommun}
              </button>
            </div>
          </>
        )}

        {step === 'private' && (
          <>
            <p className="text-gray-500 text-sm mb-6">
              Skapar ett företagskonto. Bjud in entreprenörer och åskådare från projektsidan efteråt.
            </p>
            <form onSubmit={e => handleSubmit(e, 'private_company')} className="space-y-4">
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
              <button type="button" onClick={() => setStep('choose')} className="w-full text-sm text-gray-500 hover:underline">
                {t.common.back}
              </button>
            </form>
          </>
        )}

        {step === 'kommun' && (
          <>
            <p className="text-gray-500 text-sm mb-6">
              Skapar ett konto för ett kommunalt bolag. Bjud in entreprenörer och åskådare från projektsidan efteråt.
            </p>
            <form onSubmit={e => handleSubmit(e, 'kommun')} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t.auth.chooseKommun}</label>
                <select required value={kommun} onChange={e => setKommun(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="" disabled>{t.auth.chooseKommun}</option>
                  {SWEDISH_KOMMUNER.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.auth.kommunalBolagOrgNumber}</label>
                <div className="flex gap-2">
                  <input type="text" required value={bolagOrgNumber} onChange={e => setBolagOrgNumber(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={handleSearchCompany} disabled={!bolagOrgNumber || searching}
                    className="border border-gray-300 rounded-lg px-4 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition">
                    {searching ? t.auth.searchingCompany : t.auth.searchCompany}
                  </button>
                </div>
                {lookupMessage && <p className="text-amber-600 text-xs mt-1">{lookupMessage}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.auth.companyName}</label>
                <input type="text" required value={bolagName} onChange={e => setBolagName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.auth.fullName}</label>
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
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
              <button type="button" onClick={() => setStep('choose')} className="w-full text-sm text-gray-500 hover:underline">
                {t.common.back}
              </button>
            </form>
          </>
        )}

        <p className="mt-4 text-sm text-gray-500">
          <Link href="/auth/login" className="text-blue-700 hover:underline">{t.auth.hasAccount}</Link>
        </p>
      </div>
    </div>
  )
}
