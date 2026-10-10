'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Field, { fieldInputClassName } from '@/components/ui/Field'

function LoginForm() {
  const router = useRouter()
  const next = useSearchParams().get('next')
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
