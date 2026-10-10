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
import { serviceSummary, VERDICT_LABELS } from '@/lib/cases'
import ComplementForm from './ComplementForm'
import ClinicRequestPanel from './ClinicRequestPanel'
import CardTitle from '@/components/ui/CardTitle'
import VideoMeetingList from '@/components/video/VideoMeetingList'
import { createClient } from '@/lib/supabase/server'
import { MEETING_COLUMNS, hasBankIdSession, type VideoMeeting } from '@/lib/video'
import PageHeader from '@/components/ui/PageHeader'

function ReviewSection({ title, text }: { title: string; text: string | null }) {
  if (!text) return null
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
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
  const { case: c, analysis, files, messages, clinicReview, clinicRequests } = bundle
  const answered = c.status === 'besvarat' || c.status === 'avslutat'
  const supabase = await createClient()
  const [{ data: meetings }, bankIdSession, { data: identity }] = await Promise.all([
    supabase.from('video_meetings').select(MEETING_COLUMNS).eq('case_id', id).order('scheduled_at'),
    hasBankIdSession(profile.id),
    supabase.from('profiles').select('personnummer').eq('id', profile.id).single(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader icon="clipboard" eyebrow="Ditt ärende" title={c.title} badge={<StatusBadge status={c.status} />}>
        {serviceSummary(c.services)}
        {c.clinic_name && ` — ${c.clinic_name}`} · Skapat {new Date(c.created_at).toLocaleDateString('sv-SE')}
      </PageHeader>

      {uppladdning === 'misslyckades' && (
        <Card className="border-amber-300 bg-amber-50 text-sm">
          En eller flera filer kunde inte laddas upp. Skicka dem gärna som meddelande eller kontakta oss.
        </Card>
      )}

      {c.status === 'komplettering' && c.info_request ? (
        <ComplementForm caseId={c.id} patientId={profile.id} request={c.info_request} requestedAt={c.info_requested_at} />
      ) : answered ? (
        <Card className="space-y-4 border-accent-300 border-t-4 border-t-accent-500">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle icon="doctor">Tandläkarens bedömning</CardTitle>
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
            Besvarat {c.answered_at && new Date(c.answered_at).toLocaleDateString('sv-SE')} av Doktor Sylvia, leg. tandläkare.
            Bedömningen bygger på det underlag du skickat in och ersätter inte en undersökning.
          </p>
        </Card>
      ) : (
        <Card className="bg-accent-50 border-accent-200 text-sm text-gray-700">
          {c.status === 'inskickat'
            ? 'Ditt ärende är mottaget. Doktor Sylvia går igenom det och du får ett mejl när bedömningen är klar.'
            : c.info_answered_at
              ? 'Tack för kompletteringen! Doktor Sylvia fortsätter granskningen och du får ett mejl när bedömningen är klar.'
              : 'Doktor Sylvia granskar ditt ärende just nu. Du får ett mejl när bedömningen är klar.'}
        </Card>
      )}

      {(c.services.includes('video') || (meetings ?? []).length > 0) && (
        <Card className="space-y-4">
          <CardTitle icon="chat">Videosamtal med Doktor Sylvia</CardTitle>
          {(meetings ?? []).length === 0 && (
            <p className="text-sm text-gray-600">Doktor Sylvia bokar en tid med dig. Du får ett mejl, och samtalet syns här och under Min profil.
              Du ansluter med BankID och samtalet spelas in så att du kan se det igen.</p>
          )}
          <VideoMeetingList meetings={(meetings ?? []) as unknown as VideoMeeting[]} canPlay={bankIdSession} />
        </Card>
      )}

      <ClinicRequestPanel caseId={c.id} defaultClinicName={c.clinic_name ?? ''} requests={clinicRequests}
        canRequest={!answered} verifiedPersonnummer={bankIdSession ? identity?.personnummer ?? null : null} />

      {analysis.lines.length > 0 && (
        <Card>
          <CardTitle icon="chart" className="mb-4">Automatisk prisjämförelse</CardTitle>
          <PriceAnalysisView analysis={analysis} />
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-3">
          <CardTitle icon="folder">Ditt underlag</CardTitle>
          {c.patient_description && <p className="text-sm whitespace-pre-wrap">{c.patient_description}</p>}
          {c.patient_questions && (
            <p className="text-sm whitespace-pre-wrap"><span className="font-medium">Dina frågor: </span>{c.patient_questions}</p>
          )}
          <CaseFilesList files={files} />
        </Card>
        <Card>
          <CardTitle icon="chat" className="mb-4">Meddelanden</CardTitle>
          <CaseMessages caseId={c.id} viewerId={profile.id} messages={messages} />
        </Card>
      </div>
    </div>
  )
}
