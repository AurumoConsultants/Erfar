'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDeleteButton({ url, confirmMessage }: { url: string; confirmMessage: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    if (!confirm(confirmMessage)) return
    setBusy(true)
    setError('')
    const res = await fetch(url, { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? 'Något gick fel.')
      setBusy(false)
      return
    }
    router.refresh()
  }

  return (
    <div className="text-right">
      <button
        onClick={handleDelete}
        disabled={busy}
        className="text-sm border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition"
      >
        {busy ? 'Tar bort...' : 'Ta bort'}
      </button>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
