'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SWEDISH_KOMMUNER } from '@erfar/shared'
import type { Company } from '@erfar/shared'

export default function CompanyEditForm({ company }: { company: Company }) {
  const router = useRouter()
  const [name, setName] = useState(company.name)
  const [accountType, setAccountType] = useState(company.account_type)
  const [kommun, setKommun] = useState(company.kommun ?? '')
  const [orgNumber, setOrgNumber] = useState(company.org_number ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch(`/api/admin/companies/${company.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        account_type: accountType,
        kommun: accountType === 'kommun' ? kommun : null,
        org_number: orgNumber,
      }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Något gick fel.'); setSaving(false); return }
    router.push('/admin/companies')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium mb-1">Namn</label>
        <input required value={name} onChange={e => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Typ</label>
        <select value={accountType} onChange={e => setAccountType(e.target.value as 'private_company' | 'kommun')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="private_company">Privat företag</option>
          <option value="kommun">Kommun</option>
        </select>
      </div>
      {accountType === 'kommun' && (
        <div>
          <label className="block text-sm font-medium mb-1">Kommun</label>
          <select value={kommun} onChange={e => setKommun(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Välj kommun</option>
            {SWEDISH_KOMMUNER.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Organisationsnummer</label>
        <input value={orgNumber} onChange={e => setOrgNumber(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition">
          {saving ? 'Sparar...' : 'Spara'}
        </button>
        <button type="button" onClick={() => router.push('/admin/companies')}
          className="border border-gray-300 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition">
          Avbryt
        </button>
      </div>
    </form>
  )
}
