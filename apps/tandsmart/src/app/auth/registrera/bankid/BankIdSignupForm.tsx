'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Field, { fieldInputClassName } from '@/components/ui/Field'

export default function BankIdSignupForm() {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consent) return setError('Du behöver godkänna behandlingen av dina hälsouppgifter för att vi ska kunna granska ditt ärende.')
    setLoading(true)
    setError(null)
    const res = await fetch('/api/auth/bankid-konto', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, consent }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      setLoading(false)
      return setError(json.error ?? 'Kunde inte skapa kontot. Försök igen.')
    }
    // Full navigation so the new session cookies are picked up everywhere.
    window.location.assign(json.next ?? '/arenden/nytt')
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="E-post" htmlFor="email" hint="Hit skickar vi besked när Doktor Sylvia har svarat.">
        <input id="email" type="email" required autoComplete="email" value={email}
          onChange={e => setEmail(e.target.value)} className={fieldInputClassName()} />
      </Field>
      <label className="flex gap-3 text-sm text-gray-700">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1" />
        <span>
          Jag samtycker till att Tandsmart behandlar de hälsouppgifter jag laddar upp (prisförslag, vårdplan,
          röntgen) för att granska mitt ärende. Läs mer i vår{' '}
          <Link href="/integritet" className="underline" target="_blank">integritetspolicy</Link>.
        </span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">{loading ? 'Skapar konto…' : 'Skapa konto'}</Button>
    </form>
  )
}
