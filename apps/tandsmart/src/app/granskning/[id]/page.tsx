import { notFound } from 'next/navigation'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/StatusBadge'
import PriceAnalysisView from '@/components/PriceAnalysisView'
import CaseMessages from '@/components/CaseMessages'
import CaseFilesList from '@/components/CaseFilesList'
import { requireDentist } from '@/lib/auth'
import { loadCase } from '@/lib/caseData'
import { normalizeOrgNumber } from '@/lib/orgNumber'
import { SERVICE_LABELS, clinicSourceLinks } from '@/lib/cases'
import { AiDraftSchema } from '@/lib/ai/draftSchema'
import ReviewWorkspace from './ReviewWorkspace'
import ClinicReviewForm from './ClinicReviewForm'

export default async function ReviewCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dentist = await requireDentist()
  const bundle = await loadCase(id, dentist.id)
  if (!bundle) notFound()
  const { case: c, patient, analysis, files, messages, clinicReview } = bundle

  const parsedDraft = AiDraftSchema.safeParse(c.ai_draft)
  const orgNumber = normalizeOrgNumber(c.clinic_org_number)
  const age = patient?.birth_year ? new Date().getFullYear() - patient.birth_year : null

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">{c.title}</h1>
          <StatusBadge status={c.status} />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {patient?.full_name}{age != null && `, ${age} år`} · {c.services.map(s => SERVICE_LABELS[s]).join(' · ')}
          {' · '}Inkom {new Date(c.created_at).toLocaleDateString('sv-SE')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-3">
          <h2 className="font-semibold">Patientens underlag</h2>
          <dl className="text-sm grid grid-cols-3 gap-x-3 gap-y-1">
            <dt className="text-gray-500">Klinik</dt>
            <dd className="col-span-2">{c.clinic_name ?? '—'}{c.clinic_city && `, ${c.clinic_city}`}{c.is_specialist && ' (specialist)'}</dd>
            <dt className="text-gray-500">Org.nr</dt><dd className="col-span-2">{c.clinic_org_number ?? '—'}</dd>
            <dt className="text-gray-500">Tandläkare</dt><dd className="col-span-2">{c.treating_dentist ?? '—'}</dd>
          </dl>
          {c.patient_description && <p className="text-sm whitespace-pre-wrap">{c.patient_description}</p>}
          {c.patient_questions && (
            <p className="text-sm whitespace-pre-wrap"><span className="font-medium">Frågor: </span>{c.patient_questions}</p>
          )}
          <CaseFilesList files={files} />
        </Card>
        <Card>
          <h2 className="font-semibold mb-3">Prisjämförelse</h2>
          <PriceAnalysisView analysis={analysis} />
        </Card>
      </div>

      <ReviewWorkspace
        caseId={c.id}
        status={c.status}
        hasItems={bundle.items.length > 0}
        aiEnabled={process.env.TANDSMART_AI_ENABLED === 'true'}
        initialDraft={parsedDraft.success ? parsedDraft.data : null}
        draftAt={c.ai_draft_at}
        initialReview={{
          verdict: c.review_verdict ?? '',
          summary: c.review_summary ?? '',
          price: c.review_price ?? '',
          plan: c.review_plan ?? '',
          clinic: c.review_clinic ?? '',
          questions: c.review_questions ?? '',
        }}
      />

      {c.services.includes('klinik') || orgNumber ? (
        <Card className="space-y-4">
          <h2 className="font-semibold">Klinikkoll</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {clinicSourceLinks(c.clinic_name, orgNumber).map(link => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer"
                className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200">{link.label} ↗</a>
            ))}
          </div>
          {orgNumber ? (
            <ClinicReviewForm orgNumber={orgNumber} defaultName={c.clinic_name ?? ''} initial={clinicReview} />
          ) : (
            <p className="text-sm text-gray-500">Organisationsnummer saknas — be patienten om det i ett meddelande för att spara en klinikbedömning.</p>
          )}
        </Card>
      ) : null}

      <Card>
        <h2 className="font-semibold mb-3">Meddelanden med patienten</h2>
        <CaseMessages caseId={c.id} viewerId={dentist.id} messages={messages} />
      </Card>
    </div>
  )
}
