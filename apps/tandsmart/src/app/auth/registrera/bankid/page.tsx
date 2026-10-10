import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Card from '@/components/ui/Card'
import { BANKID_PENDING_COOKIE, readPendingIdentity } from '@/lib/bankid'
import BankIdSignupForm from './BankIdSignupForm'

// Second step of signing up with BankID: identity is already verified, the
// patient adds an e-mail address (for notifications) and consents.
export default async function BankIdSignupPage() {
  const identity = readPendingIdentity((await cookies()).get(BANKID_PENDING_COOKIE)?.value)
  if (!identity) redirect('/auth/login?bankid=avbrutet')

  return (
    <Card className="max-w-md mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold">Skapa konto med BankID</h1>
        <p className="text-sm text-gray-600 mt-1">Du är identifierad med BankID. Fyll i din e-postadress så skapar vi kontot.</p>
      </div>
      <dl className="rounded-xl bg-accent-50 border border-accent-200 p-3 text-sm grid grid-cols-3 gap-y-1">
        <dt className="text-gray-500">Namn</dt><dd className="col-span-2 font-medium">{identity.name}</dd>
        <dt className="text-gray-500">Personnummer</dt><dd className="col-span-2 font-mono">{identity.personnummer.slice(0, 8)}-****</dd>
      </dl>
      <BankIdSignupForm />
    </Card>
  )
}
