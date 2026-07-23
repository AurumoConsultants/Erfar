'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SWEDISH_KOMMUNER } from '@erfar/shared'
import Field, { fieldInputClassName } from '@/components/ui/Field'
import Button from '@/components/ui/Button'

type AccountType = 'private_company' | 'kommun'

// Superadmin-only equivalent of the old public signup form — same
// company-lookup convenience, but collects the first admin's name/email
// instead of a password: they get an invite email and choose their own.
export default function NewCompanyPage() {
  const router = useRouter()
  const [accountType, setAccountType] = useState<AccountType>('private_company')

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

  const [adminFullName, setAdminFullName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSearchCompany() {
    setSearching(true)
    setLookupMessage('')
    try {
      const res = await fetch(`/api/company-lookup?orgNumber=${encodeURIComponent(bolagOrgNumber)}`)
      const json = await res.json()
      if (!res.ok) setLookupMessage(json.error ?? 'Företaget hittades inte.')
      else if (!json.configured) setLookupMessage('Automatisk sökning är inte tillgänglig.')
      else if (json.name) setBolagName(json.name)
      else setLookupMessage(json.error ?? 'Företaget hittades inte.')
    } catch {
      setLookupMessage('Företaget hittades inte.')
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
      if (!res.ok) setNameSearchMessage(json.error ?? 'Inga företag hittades.')
      else if (!json.configured) setNameSearchMessage('Automatisk sökning är inte tillgänglig.')
      else if (json.results?.length) setSearchResults(json.results)
      else setNameSearchMessage(json.error ?? 'Inga företag hittades.')
    } catch {
      setNameSearchMessage('Inga företag hittades.')
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const body =
      accountType === 'private_company'
        ? { companyName, orgNumber, accountType, adminFullName, adminEmail }
        : { companyName: bolagName, orgNumber: bolagOrgNumber, accountType, kommun, adminFullName, adminEmail }

    const res = await fetch('/api/admin/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Något gick fel.'); setLoading(false); return }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="max-w-lg space-y-4">
        <h1 className="text-2xl font-bold">Företag skapat</h1>
        <p className="text-gray-600 text-sm">
          {adminFullName} ({adminEmail}) har fått ett mejl för att slutföra sitt konto.
        </p>
        <Button onClick={() => router.push('/admin/companies')}>Till företagslistan</Button>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Nytt företag</h1>

      <div className="flex mb-2 border border-gray-200 rounded-lg overflow-hidden w-fit">
        <button
          type="button"
          onClick={() => setAccountType('private_company')}
          className={`px-4 py-2 text-sm font-semibold transition ${accountType === 'private_company' ? 'bg-accent-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          Privat företag
        </button>
        <button
          type="button"
          onClick={() => setAccountType('kommun')}
          className={`px-4 py-2 text-sm font-semibold transition ${accountType === 'kommun' ? 'bg-accent-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          Kommun
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {accountType === 'private_company' ? (
          <>
            <Field label="Företagsnamn" htmlFor="companyName">
              <input id="companyName" type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} className={fieldInputClassName()} />
            </Field>
            <Field label="Organisationsnummer" htmlFor="orgNumber">
              <input id="orgNumber" type="text" value={orgNumber} onChange={e => setOrgNumber(e.target.value)} className={fieldInputClassName()} />
            </Field>
          </>
        ) : (
          <>
            <Field label="Välj kommun" htmlFor="kommun">
              <select id="kommun" required value={kommun} onChange={e => setKommun(e.target.value)} className={fieldInputClassName()}>
                <option value="" disabled>Välj kommun</option>
                {SWEDISH_KOMMUNER.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </Field>
            <Field label="Sök företag på namn" htmlFor="companyQuery">
              <div className="flex gap-2">
                <input id="companyQuery" type="text" value={companyQuery} onChange={e => setCompanyQuery(e.target.value)}
                  placeholder="T.ex. Exempel Kommunala Bolag AB" className={fieldInputClassName('flex-1')} />
                <button type="button" onClick={handleSearchCompanyByName} disabled={!companyQuery || searchingByName}
                  className="border border-gray-300 rounded-lg px-4 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition">
                  {searchingByName ? 'Söker...' : 'Sök'}
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
            </Field>
            <p className="text-center text-xs text-gray-400">eller</p>
            <Field label="Organisationsnummer för det kommunala bolaget" htmlFor="bolagOrgNumber">
              <div className="flex gap-2">
                <input id="bolagOrgNumber" type="text" required value={bolagOrgNumber} onChange={e => setBolagOrgNumber(e.target.value)} className={fieldInputClassName('flex-1')} />
                <button type="button" onClick={handleSearchCompany} disabled={!bolagOrgNumber || searching}
                  className="border border-gray-300 rounded-lg px-4 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition">
                  {searching ? 'Söker...' : 'Sök'}
                </button>
              </div>
              {lookupMessage && <p className="text-amber-600 text-xs mt-1">{lookupMessage}</p>}
            </Field>
            <Field label="Företagsnamn" htmlFor="bolagName">
              <input id="bolagName" type="text" required value={bolagName} onChange={e => setBolagName(e.target.value)} className={fieldInputClassName()} />
            </Field>
          </>
        )}

        <hr className="border-gray-100" />

        <Field label="Kontaktperson (första användaren)" htmlFor="adminFullName">
          <input id="adminFullName" type="text" required value={adminFullName} onChange={e => setAdminFullName(e.target.value)} className={fieldInputClassName()} />
        </Field>
        <Field label="E-post" htmlFor="adminEmail" hint="Får ett mejl för att välja lösenord.">
          <input id="adminEmail" type="email" required value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className={fieldInputClassName()} />
        </Field>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Skapar...' : 'Skapa företag och skicka inbjudan'}
        </Button>
      </form>
    </div>
  )
}
