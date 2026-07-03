'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { SWEDISH_KOMMUNER } from '@erfar/shared'

type Mode = 'login' | 'signup'
type SignupStep = 'choose' | 'private' | 'kommun'

export default function AuthForm({ initialMode }: { initialMode: Mode }) {
  const { t } = useI18n()
  const supabase = createClient()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [signupStep, setSignupStep] = useState<SignupStep>('choose')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [orgNumber, setOrgNumber] = useState('')
  const [kommun, setKommun] = useState('')
  const [bolagOrgNumber, setBolagOrgNumber] = useState('')
  const [bolagName, setBolagName] = useState('')
  const [searching, setSearching] = useState(false)
  const [lookupMessage, setLookupMessage] = useState('')

  const [companyQuery, setCompanyQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ name: string; orgNumber: string }[]>([])
  const [searchingByName, setSearchingByName] = useState(false)
  const [nameSearchMessage, setNameSearchMessage] = useState('')

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setSignupStep('choose')
  }

  // After login/signup, admins go to /admin instead of the company dashboard —
  // they have no company_id, so the regular app pages have nothing to show them.
  async function redirectAfterAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (profile?.is_admin) { window.location.href = '/admin'; return }
    }
    window.location.href = '/dashboard'
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    await redirectAfterAuth()
  }

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

  async function handleSearchCompanyByName() {
    setSearchingByName(true)
    setNameSearchMessage('')
    setSearchResults([])
    try {
      const res = await fetch(`/api/company-lookup?name=${encodeURIComponent(companyQuery)}`)
      const json = await res.json()
      if (!res.ok) {
        setNameSearchMessage(json.error ?? t.auth.companySearchNoResults)
      } else if (!json.configured) {
        setNameSearchMessage(t.auth.lookupNotConfigured)
      } else if (json.results?.length) {
        setSearchResults(json.results)
      } else {
        setNameSearchMessage(json.error ?? t.auth.companySearchNoResults)
      }
    } catch {
      setNameSearchMessage(t.auth.companySearchNoResults)
    } finally {
      setSearchingByName(false)
    }
  }

  function selectSearchResult(result: { name: string; orgNumber: string }) {
    setBolagName(result.name)
    setBolagOrgNumber(result.orgNumber)
    setSearchResults([])
    setCompanyQuery('')
    setNameSearchMessage('')
  }

  async function handleSignup(e: React.FormEvent, accountType: 'private_company' | 'kommun') {
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

    await redirectAfterAuth()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <p className="text-blue-700 font-bold text-2xl mb-6 text-center">Erfar</p>

        <div className="flex mb-6 border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            {t.auth.login}
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2 text-sm font-semibold transition ${mode === 'signup' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            {t.auth.signup}
          </button>
        </div>

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t.auth.email}</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.auth.password}</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full bg-blue-700 text-white font-semibold py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition"
            >
              {loading ? t.common.loading : t.auth.login}
            </button>
          </form>
        )}

        {mode === 'signup' && signupStep === 'choose' && (
          <>
            <p className="text-gray-500 text-sm mb-6">{t.auth.accountTypePrompt}</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setSignupStep('private')}
                className="border border-gray-300 rounded-lg py-6 px-3 text-center font-semibold hover:bg-gray-50 hover:border-blue-400 transition">
                {t.auth.accountTypePrivate}
              </button>
              <button type="button" onClick={() => setSignupStep('kommun')}
                className="border border-gray-300 rounded-lg py-6 px-3 text-center font-semibold hover:bg-gray-50 hover:border-blue-400 transition">
                {t.auth.accountTypeKommun}
              </button>
            </div>
          </>
        )}

        {mode === 'signup' && signupStep === 'private' && (
          <>
            <p className="text-gray-500 text-sm mb-6">
              Skapar ett företagskonto. Bjud in entreprenörer och åskådare från projektsidan efteråt.
            </p>
            <form onSubmit={e => handleSignup(e, 'private_company')} className="space-y-4">
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
              <button type="button" onClick={() => setSignupStep('choose')} className="w-full text-sm text-gray-500 hover:underline">
                {t.common.back}
              </button>
            </form>
          </>
        )}

        {mode === 'signup' && signupStep === 'kommun' && (
          <>
            <p className="text-gray-500 text-sm mb-6">
              Skapar ett konto för ett kommunalt bolag. Bjud in entreprenörer och åskådare från projektsidan efteråt.
            </p>
            <form onSubmit={e => handleSignup(e, 'kommun')} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t.auth.chooseKommun}</label>
                <select required value={kommun} onChange={e => setKommun(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="" disabled>{t.auth.chooseKommun}</option>
                  {SWEDISH_KOMMUNER.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.auth.searchCompanyByName}</label>
                <div className="flex gap-2">
                  <input type="text" value={companyQuery} onChange={e => setCompanyQuery(e.target.value)}
                    placeholder={t.auth.companyNamePlaceholder}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={handleSearchCompanyByName} disabled={!companyQuery || searchingByName}
                    className="border border-gray-300 rounded-lg px-4 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition">
                    {searchingByName ? t.auth.searchingCompany : t.auth.searchCompany}
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
                    {searchResults.map(r => (
                      <button key={r.orgNumber} type="button" onClick={() => selectSearchResult(r)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 transition text-sm flex items-center justify-between gap-2">
                        <span className="font-medium">{r.name}</span>
                        <span className="text-gray-400 text-xs shrink-0">{r.orgNumber}</span>
                      </button>
                    ))}
                  </div>
                )}
                {nameSearchMessage && <p className="text-amber-600 text-xs mt-1">{nameSearchMessage}</p>}
              </div>
              <p className="text-center text-xs text-gray-400">{t.auth.orSeparator}</p>
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
              <button type="button" onClick={() => setSignupStep('choose')} className="w-full text-sm text-gray-500 hover:underline">
                {t.common.back}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
