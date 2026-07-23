'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import Field, { fieldInputClassName } from '@/components/ui/Field'
import Button from '@/components/ui/Button'

// Lands here from the invite email's link (already authenticated via the
// invite token in the URL) — the customer chooses their own password
// instead of the superadmin typing one for them.
export default function SetPasswordPage() {
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Lösenorden matchar inte.')
      return
    }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }

    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-center mb-6">
          <Image src="/logo.png" alt="Erfar" width={170} height={54} priority />
        </div>
        <h1 className="text-xl font-bold text-center mb-1">Välkommen till Erfar</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Välj ett lösenord för att slutföra ditt konto.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Lösenord" htmlFor="password">
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={fieldInputClassName()}
            />
          </Field>
          <Field label="Bekräfta lösenord" htmlFor="confirm">
            <input
              id="confirm"
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className={fieldInputClassName()}
            />
          </Field>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Sparar...' : 'Spara lösenord'}
          </Button>
        </form>
      </div>
    </div>
  )
}
