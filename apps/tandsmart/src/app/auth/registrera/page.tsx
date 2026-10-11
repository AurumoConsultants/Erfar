'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button, { buttonClassName } from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Field, { fieldInputClassName } from '@/components/ui/Field'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consent) {
      setError('Du behöver godkänna behandlingen av dina hälsouppgifter för att vi ska kunna granska ditt ärende.')
      return
    }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, birth_year: birthYear, consent_at: new Date().toISOString() },
        emailRedirectTo: `${window.location.origin}/arenden`,
      },
    })
    setLoading(false)
    if (error) {
      setError(error.message.includes('registered') ? 'E-postadressen används redan.' : 'Kunde inte skapa kontot. Försök igen.')
      return
    }
    if (!data.session) {
      setInfo('Klart! Bekräfta din e-postadress via länken vi skickat, sedan kan du logga in.')
      return
    }
    router.push('/arenden/nytt')
    router.refresh()
  }

  return (
    <Card className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Skapa konto</h1>
      {info ? (
        <p className="text-sm text-gray-700">{info}</p>
      ) : (
        <>
        {process.env.NEXT_PUBLIC_BANKID_ENABLED === 'true' && (
          <>
            <a href="/auth/bankid?next=/arenden/nytt"
              className={buttonClassName('primary', 'w-full mb-2 bg-brand-navy! hover:opacity-90')}>
              Skapa konto med BankID
            </a>
            <p className="text-center text-xs text-gray-500 mb-4">Snabbast — namn och personnummer hämtas från BankID.</p>
            <p className="text-center text-xs text-gray-400 mb-4">eller med e-post och lösenord</p>
          </>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Namn" htmlFor="name">
            <input id="name" required autoComplete="name" value={fullName}
              onChange={e => setFullName(e.target.value)} className={fieldInputClassName()} />
          </Field>
          <Field label="Födelseår" htmlFor="birthYear" hint="Används för att räkna ut ditt tandvårdsstöd (t.ex. tiotandvården från 67 år).">
            <input id="birthYear" inputMode="numeric" pattern="(19|20)[0-9]{2}" placeholder="1965" value={birthYear}
              onChange={e => setBirthYear(e.target.value)} className={fieldInputClassName()} />
          </Field>
          <Field label="E-post" htmlFor="email">
            <input id="email" type="email" required autoComplete="email" value={email}
              onChange={e => setEmail(e.target.value)} className={fieldInputClassName()} />
          </Field>
          <Field label="Lösenord" htmlFor="password" hint="Minst 8 tecken.">
            <input id="password" type="password" required minLength={8} autoComplete="new-password" value={password}
              onChange={e => setPassword(e.target.value)} className={fieldInputClassName()} />
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
        </>
      )}
      <p className="text-sm text-gray-500 mt-4">
        Har du redan ett konto? <Link href="/auth/login" className="text-accent-700 font-medium">Logga in</Link>
      </p>
    </Card>
  )
}
