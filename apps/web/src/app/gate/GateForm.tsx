'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function GateForm() {
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? 'Fel lösenord.')
      setLoading(false)
      return
    }

    const redirect = searchParams.get('redirect') || '/'
    window.location.href = redirect
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="password"
        required
        autoFocus
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Lösenord"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-600 text-white font-semibold py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition"
      >
        {loading ? 'Kontrollerar...' : 'Fortsätt'}
      </button>
    </form>
  )
}
