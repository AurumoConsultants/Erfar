import { notFound } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import { buttonClassName } from '@/components/ui/Button'
import { meetingAccess } from '@/lib/video'
import { formatMeetingTime } from '@/components/video/VideoMeetingList'
import VideoRoom from './VideoRoom'

// The video consultation itself. Dentists join as host (and can record);
// patients must be signed in with BankID and consent to the recording first.
export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await meetingAccess(id)
  if (!access) notFound()
  const { meeting, isDentist, bankId, profile } = access
  const back = isDentist ? `/granskning/${meeting.case_id}` : `/arenden/${meeting.case_id}`

  const header = (
    <PageHeader icon="chat" eyebrow="Videosamtal med Doktor Sylvia" title={formatMeetingTime(meeting.scheduled_at)}>
      {meeting.duration_minutes} minuter · <Link href={back} className="underline">Till ärendet</Link>
    </PageHeader>
  )

  if (meeting.status !== 'bokad') {
    return <div className="space-y-6">{header}<Card>Samtalet är {meeting.status === 'avbokad' ? 'avbokat' : 'genomfört'}.
      {!isDentist && <> Inspelningen finns under <Link href="/profil" className="underline">Min profil</Link>.</>}</Card></div>
  }

  if (!isDentist && !bankId) {
    return (
      <div className="space-y-6">
        {header}
        <Card className="space-y-3">
          <p>Videosamtalet innehåller uppgifter om din hälsa, så du behöver logga in med BankID innan du ansluter.</p>
          <a href={`/auth/bankid?next=/video/${id}`} className={buttonClassName('primary', 'bg-brand-navy!')}>Logga in med BankID</a>
        </Card>
      </div>
    )
  }

  const url = new URL(isDentist ? meeting.host_room_url : meeting.room_url)
  url.searchParams.set('displayName', isDentist ? 'Doktor Sylvia' : profile.full_name)
  return (
    <div className="space-y-6">
      {header}
      <VideoRoom meetingId={id} roomUrl={url.toString()} needsConsent={!isDentist && !meeting.recording_consent_at} isDentist={isDentist} />
    </div>
  )
}
