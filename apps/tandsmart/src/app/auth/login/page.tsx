'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button, { buttonClassName } from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Field, { fieldInputClassName } from '@/components/ui/Field'

const BANKID_MESSAGES: Record<string, string> = {
  saknas: 'Det finns inget konto kopplat till ditt BankID än. Logga in med e-post (eller skapa ett konto) och koppla sedan BankID under Min profil.',
  'ej-aktiverat': 'Inloggning med BankID är inte aktiverad än.',
  'annat-konto': 'Det här BankID:t är redan kopplat till ett annat konto.',
  avbrutet: 'BankID-inloggningen avbröts.',
  fel: 'BankID-inloggningen misslyckades. Försök igen.',
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next')
  const bankid = params.get('bankid')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Fel e-post eller lösenord.')
      setLoading(false)
      return
    }
    // Only follow same-site relative paths, never an absolute URL.
    router.push(next?.startsWith('/') && !next.startsWith('//') ? next : '/arenden')
    router.refresh()
  }

  return (
    <Card className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Logga in</h1>
      {bankid && (
        <p className="text-sm rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4">
          {BANKID_MESSAGES[bankid] ?? BANKID_MESSAGES.fel}
        </p>
      )}
      <a href={`/auth/bankid?next=${encodeURIComponent(next?.startsWith('/') && !next.startsWith('//') ? next : '/arenden')}`}
        className={buttonClassName('primary', 'w-full mb-4 bg-brand-navy! hover:opacity-90')}>
        Logga in med BankID
      </a>
      <p className="text-center text-xs text-gray-400 mb-4">eller med e-post</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="E-post" htmlFor="email">
          <input id="email" type="email" required autoComplete="email" value={email}
            onChange={e => setEmail(e.target.value)} className={fieldInputClassName()} />
        </Field>
        <Field label="Lösenord" htmlFor="password">
          <input id="password" type="password" required autoComplete="current-password" value={password}
            onChange={e => setPassword(e.target.value)} className={fieldInputClassName()} />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">{loading ? 'Loggar in…' : 'Logga in'}</Button>
      </form>
      <p className="text-sm text-gray-500 mt-4">
        Inget konto? <Link href="/auth/registrera" className="text-accent-700 font-medium">Skapa ett</Link>
      </p>
    </Card>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
