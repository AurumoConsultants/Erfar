import type { Metadata } from 'next'
import Card from '@/components/ui/Card'
import { findActiveClinicRequest } from '@/lib/clinicRequestServer'
import { itemLabels } from '@/lib/clinicRequest'
import ClinicUploadForm from './ClinicUploadForm'

export const metadata: Metadata = {
  title: 'Skicka journaluppgifter | Tandsmart',
  robots: { index: false, follow: false },
}

// Public page reached from the link emailed to the patient's clinic.
export default async function ClinicUploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const request = await findActiveClinicRequest(token)

  if (!request) {
    return (
      <Card className="max-w-xl mx-auto text-center space-y-2 py-10">
        <h1 className="text-xl font-bold">Länken gäller inte längre</h1>
        <p className="text-sm text-gray-600">
          Den kan ha gått ut, återkallats av patienten eller så är ärendet redan avslutat. Be patienten skicka en ny begäran
          via Tandsmart om ni ska lämna ut uppgifter.
        </p>
      </Card>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Begäran om journalkopia</h1>
        <p className="text-gray-600 mt-1">
          Till {request.clinic_name}. Patienten har bett er skicka kopior av sina uppgifter till Tandsmart, där en
          legitimerad tandläkare gör en second opinion.
        </p>
      </div>

      {request.bankid_verified_at ? (
        <Card className="flex gap-3 items-start border-green-300 bg-green-50">
          <span aria-hidden className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">✓</span>
          <div className="text-sm">
            <p className="font-semibold text-green-900">Patienten har legitimerat sig med BankID</p>
            <p className="text-green-900/80">
              {request.bankid_name ?? request.patient_name}, {request.patient_personnummer}. Legitimerad{' '}
              {new Date(request.bankid_verified_at).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Stockholm' })}.
              Namn och personnummer kommer från BankID och kan inte ändras av patienten.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="text-sm border-amber-300 bg-amber-50">
          Den här begäran skapades innan Tandsmart krävde BankID. Patientens identitet är inte verifierad med BankID —
          kontrollera den enligt era rutiner innan ni lämnar ut uppgifter.
        </Card>
      )}

      <Card className="space-y-3">
        <h2 className="font-semibold">Patient</h2>
        <dl className="grid grid-cols-3 gap-x-3 gap-y-1 text-sm">
          <dt className="text-gray-500">Namn</dt><dd className="col-span-2">{request.patient_name}</dd>
          <dt className="text-gray-500">Personnummer</dt><dd className="col-span-2 font-mono">{request.patient_personnummer}</dd>
          <dt className="text-gray-500">Önskas</dt><dd className="col-span-2">{itemLabels(request.requested_items).join(', ')}</dd>
          {request.period && (<><dt className="text-gray-500">Period</dt><dd className="col-span-2">{request.period}</dd></>)}
          <dt className="text-gray-500">Länken gäller till</dt><dd className="col-span-2">{new Date(request.expires_at).toLocaleDateString('sv-SE')}</dd>
        </dl>
      </Card>

      <Card className="space-y-2 bg-gray-50">
        <h2 className="font-semibold">Patientens samtycke</h2>
        <blockquote className="text-sm border-l-4 border-accent-300 pl-3 italic">{request.consent_text}</blockquote>
        <p className="text-xs text-gray-500">
          Lämnat {new Date(request.consented_at).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Stockholm' })} av patienten,
          {request.bankid_verified_at ? ' legitimerad med BankID.' : ' inloggad i Tandsmart.'} Samtycket bryter tystnadsplikten för just dessa uppgifter till Tandsmart. Bedöm själva om
          underlaget räcker för er dokumentation av utlämnandet, och journalför utlämnandet enligt era rutiner.
        </p>
      </Card>

      {request.uploaded_files > 0 && (
        <Card className="border-green-300 bg-green-50 text-sm">
          {request.uploaded_files} fil(er) har redan tagits emot. Ni kan skicka fler så länge länken gäller.
        </Card>
      )}

      <ClinicUploadForm token={token} />

      <p className="text-xs text-gray-500">
        Filerna överförs krypterat och lagras i EU (Stockholm). De är bara tillgängliga för patienten och den granskande
        tandläkaren. Frågor? Svara på mejlet ni fick.
      </p>
    </div>
  )
}
