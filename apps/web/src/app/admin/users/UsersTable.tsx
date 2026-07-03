'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_LABELS } from '@erfar/shared'
import type { UserRole } from '@erfar/shared'

interface UserRow {
  id: string
  full_name: string
  email: string
  role: UserRole
  is_admin: boolean
  company_id: string | null
  company_name: string | null
}

interface CompanyOption { id: string; name: string }

export default function UsersTable({ users, companies, currentUserId }: {
  users: UserRow[]
  companies: CompanyOption[]
  currentUserId: string
}) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [fullNameDrafts, setFullNameDrafts] = useState<Record<string, string>>({})
  const [emailDrafts, setEmailDrafts] = useState<Record<string, string>>({})

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id)
    setError('')
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) setError(json.error ?? 'Något gick fel.')
    setBusyId(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Ta bort denna användare permanent?')) return
    setBusyId(id)
    setError('')
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) setError(json.error ?? 'Något gick fel.')
    setBusyId(null)
    router.refresh()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {error && <p className="text-red-600 text-sm px-4 pt-4">{error}</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="px-4 py-3 font-medium">Namn</th>
            <th className="px-4 py-3 font-medium">E-post</th>
            <th className="px-4 py-3 font-medium">Företag</th>
            <th className="px-4 py-3 font-medium">Roll</th>
            <th className="px-4 py-3 font-medium">Admin</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-b border-gray-100 last:border-0">
              <td className="px-4 py-3">
                <input
                  value={fullNameDrafts[u.id] ?? u.full_name}
                  disabled={busyId === u.id}
                  onChange={e => setFullNameDrafts(d => ({ ...d, [u.id]: e.target.value }))}
                  onBlur={e => { if (e.target.value !== u.full_name) patch(u.id, { full_name: e.target.value }) }}
                  className="border border-transparent hover:border-gray-200 focus:border-gray-300 rounded-lg px-2 py-1 text-sm w-full focus:outline-none"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  value={emailDrafts[u.id] ?? u.email}
                  disabled={busyId === u.id}
                  onChange={e => setEmailDrafts(d => ({ ...d, [u.id]: e.target.value }))}
                  onBlur={e => { if (e.target.value !== u.email) patch(u.id, { email: e.target.value }) }}
                  className="border border-transparent hover:border-gray-200 focus:border-gray-300 rounded-lg px-2 py-1 text-sm w-full text-gray-500 focus:outline-none"
                />
              </td>
              <td className="px-4 py-3">
                <select
                  value={u.company_id ?? ''}
                  disabled={busyId === u.id}
                  onChange={e => patch(u.id, { company_id: e.target.value || null })}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                >
                  <option value="">Inget företag</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </td>
              <td className="px-4 py-3">
                <select
                  value={u.role}
                  disabled={busyId === u.id}
                  onChange={e => patch(u.id, { role: e.target.value })}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={u.is_admin}
                  disabled={busyId === u.id}
                  onChange={e => patch(u.id, { is_admin: e.target.checked })}
                />
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => handleDelete(u.id)}
                  disabled={busyId === u.id || u.id === currentUserId}
                  className="text-sm border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-40 transition"
                >
                  Ta bort
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
