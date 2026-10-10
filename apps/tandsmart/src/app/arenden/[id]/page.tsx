import { notFound, redirect } from 'next/navigation'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/StatusBadge'
import PriceAnalysisView from '@/components/PriceAnalysisView'
import CaseMessages from '@/components/CaseMessages'
import CaseFilesList from '@/components/CaseFilesList'
import ClinicReviewView from '@/components/ClinicReviewView'
import { requireProfile } from '@/lib/auth'
import { loadCase } from '@/lib/caseData'
import { SERVICE_LABELS, VERDICT_LABELS } from '@/lib/cases'

function ReviewSection({ title, text }: { title: string; text: string | null }) {
  if (!text) return null
  return (
    <div>
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{text}</p>
    </div>
  )
}

export default async function CasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ uppladdning?: string }>
}) {
  const { id } = await params
  const { uppladdning } = await searchParams
  const profile = await requireProfile()
  if (profile.role === 'tandlakare') redirect(`/granskning/${id}`)

  const bundle = await loadCase(id, profile.id)
  if (!bundle) notFound()
  const { case: c, analysis, files, messages, clinicReview } = bundle
  const answered = c.status === 'besvarat' || c.status === 'avslutat'

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">{c.title}</h1>
          <StatusBadge status={c.status} />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {c.services.map(s => SERVICE_LABELS[s]).join(' · ')}
          {c.clinic_name && ` — ${c.clinic_name}`} · Skapat {new Date(c.created_at).toLocaleDateString('sv-SE')}
        </p>
      </div>

      {uppladdning === 'misslyckades' && (
        <Card className="border-amber-300 bg-amber-50 text-sm">
          En eller flera filer kunde inte laddas upp. Skicka dem gärna som meddelande eller kontakta oss.
        </Card>
      )}

      {answered ? (
        <Card className="space-y-4 border-accent-300">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-semibold text-lg">Tandläkarens bedömning</h2>
            {c.review_verdict && (
              <Badge tone={VERDICT_LABELS[c.review_verdict].tone}>{VERDICT_LABELS[c.review_verdict].label}</Badge>
            )}
          </div>
          <ReviewSection title="Sammanfattning" text={c.review_summary} />
          <ReviewSection title="Priset" text={c.review_price} />
          <ReviewSection title="Vårdplanen" text={c.review_plan} />
          <ReviewSection title="Kliniken" text={c.review_clinic} />
          <ReviewSection title="Frågor att ställa till din klinik" text={c.review_questions} />
          {clinicReview && <ClinicReviewView review={clinicReview} />}
          <p className="text-xs text-gray-400">
            Besvarat {c.answered_at && new Date(c.answered_at).toLocaleDateString('sv-SE')} av Sylvia, leg. tandläkare.
            Bedömningen bygger på det underlag du skickat in och ersätter inte en undersökning.
          </p>
        </Card>
      ) : (
        <Card className="bg-accent-50 border-accent-200 text-sm text-gray-700">
          {c.status === 'inskickat'
            ? 'Ditt ärende är mottaget. Sylvia går igenom det och du får ett mejl när bedömningen är klar.'
            : 'Sylvia granskar ditt ärende just nu. Du får ett mejl när bedömningen är klar.'}
        </Card>
      )}

      {analysis.lines.length > 0 && (
        <Card>
          <h2 className="font-semibold mb-3">Automatisk prisjämförelse</h2>
          <PriceAnalysisView analysis={analysis} />
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-3">
          <h2 className="font-semibold">Ditt underlag</h2>
          {c.patient_description && <p className="text-sm whitespace-pre-wrap">{c.patient_description}</p>}
          {c.patient_questions && (
            <p className="text-sm whitespace-pre-wrap"><span className="font-medium">Dina frågor: </span>{c.patient_questions}</p>
          )}
          <CaseFilesList files={files} />
        </Card>
        <Card>
          <h2 className="font-semibold mb-3">Meddelanden</h2>
          <CaseMessages caseId={c.id} viewerId={profile.id} messages={messages} />
        </Card>
      </div>
    </div>
  )
}
