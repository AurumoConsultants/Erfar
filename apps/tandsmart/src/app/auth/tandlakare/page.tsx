import { redirect } from 'next/navigation'
import Card from '@/components/ui/Card'
import { buttonClassName } from '@/components/ui/Button'
import { dentistHasBankId, requireProfile } from '@/lib/auth'

// Dentists signed in with a password land here until they also sign in with
// BankID. The first time, BankID is linked to their account.
export default async function DentistBankIdPage() {
  const profile = await requireProfile()
  if (profile.role !== 'tandlakare') redirect('/arenden')
  if (await dentistHasBankId(profile.id)) redirect('/granskning')

  return (
    <Card className="max-w-md mx-auto space-y-4 text-center py-8">
      <h1 className="text-xl font-bold">Logga in med BankID</h1>
      <p className="text-sm text-gray-600">
        Granskningen innehåller patienters hälsouppgifter, så tandläkare behöver logga in med BankID. Första gången
        kopplas BankID till ditt konto, därefter kan du logga in direkt med BankID. Inloggningen gäller i 12 timmar.
      </p>
      <a href="/auth/bankid?next=/granskning" className={buttonClassName('primary', 'bg-brand-navy!')}>Logga in med BankID</a>
    </Card>
  )
}
