import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import { buttonClassName } from '@/components/ui/Button'
import { dentistHasBankId, requireProfile } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasBankIdSession } from '@/lib/video'
import { canJoin, formatSlot } from '@/lib/introCalls'

// The intro call room: the patient who booked it, or the dentist as host.
export default async function IntroCallRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requireProfile()
  const isDentist = profile.role === 'tandlakare'
  const admin = createAdminClient()
  const { data: slot } = await admin.from('intro_call_slots')
    .select('id, starts_at, duration_minutes, booked_by, room_url, host_room_url, patient:profiles!intro_call_slots_booked_by_fkey(full_name)')
    .eq('id', id).maybeSingle()
  if (!slot?.booked_by || (!isDentist && slot.booked_by !== profile.id)) notFound()
  if (isDentist && !(await dentistHasBankId(profile.id))) redirect('/auth/tandlakare')
  const back = isDentist ? '/granskning/startsamtal' : '/startsamtal'
  const patient = slot.patient as unknown as { full_name: string } | null

  const header = (
    <PageHeader icon="chat" eyebrow="Startsamtal" title={formatSlot(slot.starts_at)}>
      {slot.duration_minutes} minuter{isDentist && patient ? ` med ${patient.full_name}` : ' med Doktor Sylvia'} ·{' '}
      <Link href={back} className="underline">Tillbaka</Link>
    </PageHeader>
  )

  if (!isDentist && !(await hasBankIdSession(profile.id))) {
    return (
      <div className="space-y-6">{header}
        <Card className="space-y-3">
          <p>Du behöver logga in med BankID innan du ansluter till samtalet.</p>
          <a href={`/auth/bankid?next=/startsamtal/${id}`} className={buttonClassName('primary', 'bg-brand-navy!')}>Logga in med BankID</a>
        </Card>
      </div>
    )
  }

  const roomUrl = isDentist ? slot.host_room_url : slot.room_url
  if (!roomUrl || !canJoin(new Date(slot.starts_at))) {
    return (
      <div className="space-y-6">{header}
        <Card>Rummet öppnar tio minuter före samtalet och stänger en halvtimme efter starttiden.</Card>
      </div>
    )
  }

  const url = new URL(roomUrl)
  url.searchParams.set('displayName', isDentist ? 'Doktor Sylvia' : profile.full_name)
  return (
    <div className="space-y-6">
      {header}
      <iframe src={url.toString()} title="Startsamtal" allow="camera; microphone; fullscreen; speaker; display-capture; autoplay; compute-pressure"
        className="w-full h-[75vh] min-h-[480px] rounded-2xl border border-gray-200 bg-black" />
    </div>
  )
}
