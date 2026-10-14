import Link from 'next/link'
import { redirect } from 'next/navigation'
import Card from '@/components/ui/Card'
import CardTitle from '@/components/ui/CardTitle'
import PageHeader from '@/components/ui/PageHeader'
import { buttonClassName } from '@/components/ui/Button'
import { requireProfile } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasBankIdSession } from '@/lib/video'
import {
  BOOKING_LEAD_MINUTES, CALL_MINUTES, WEEKDAY_LABELS, WEEKS_AHEAD, addDays, canJoin, formatDayLabel, formatSlot,
  stockholmParts, stockholmToUtc, weekDays, weekStart,
} from '@/lib/introCalls'
import { BookSlots, CancelBooking } from './IntroCallBooking'

// Free 5-minute intro call: the patient picks one of Doktor Sylvia's open times.
export default async function IntroCallPage({ searchParams }: { searchParams: Promise<{ vecka?: string }> }) {
  const profile = await requireProfile()
  if (profile.role === 'tandlakare') redirect('/granskning/startsamtal')
  const { vecka } = await searchParams
  const offset = Math.min(Math.max(Number(vecka) || 0, 0), WEEKS_AHEAD - 1)

  const admin = createAdminClient()
  const now = Date.now()
  const [{ data: bookings }, bankId] = await Promise.all([
    admin.from('intro_call_slots').select('id, starts_at, duration_minutes')
      .eq('booked_by', profile.id).gt('starts_at', new Date(now - 30 * 60_000).toISOString()).order('starts_at').limit(1),
    hasBankIdSession(profile.id),
  ])
  const booking = bookings?.[0]

  const header = (
    <PageHeader icon="chat" eyebrow="Kostnadsfritt" title="Startsamtal med Doktor Sylvia">
      Ett kort videosamtal på {CALL_MINUTES} minuter där Doktor Sylvia hjälper dig att komma igång: vilken tjänst som passar
      och vilket underlag du behöver. Samtalet spelas inte in.
    </PageHeader>
  )

  if (booking) {
    const joinable = canJoin(new Date(booking.starts_at))
    return (
      <div className="space-y-6">
        {header}
        <Card className="space-y-4">
          <CardTitle icon="chat">Ditt bokade startsamtal</CardTitle>
          <p className="text-lg font-brand font-semibold text-brand-navy first-letter:uppercase">{formatSlot(booking.starts_at)}</p>
          <p className="text-sm text-gray-600">
            {booking.duration_minutes} minuter med video. Du kan ansluta från tio minuter före. Du har också fått en bekräftelse via e-post.
          </p>
          <div className="flex flex-wrap gap-3">
            {joinable
              ? <Link href={`/startsamtal/${booking.id}`} className={buttonClassName('primary')}>Anslut till samtalet</Link>
              : <span className={buttonClassName('secondary', 'opacity-60 cursor-not-allowed')}>Anslut (öppnar tio minuter före)</span>}
            <CancelBooking id={booking.id} />
          </div>
        </Card>
      </div>
    )
  }

  if (!bankId) {
    return (
      <div className="space-y-6">
        {header}
        <Card className="space-y-3">
          <p>Startsamtalet är ett videosamtal med legitimerad tandläkare, så du behöver logga in med BankID innan du bokar.</p>
          <a href="/auth/bankid?next=/startsamtal" className={buttonClassName('primary', 'bg-brand-navy!')}>Logga in med BankID</a>
        </Card>
      </div>
    )
  }

  const monday = weekStart(offset)
  const from = Math.max(stockholmToUtc(monday, '00:00').getTime(), now + BOOKING_LEAD_MINUTES * 60_000)
  const { data: slots } = await admin.from('intro_call_slots').select('id, starts_at')
    .is('booked_by', null)
    .gte('starts_at', new Date(from).toISOString())
    .lt('starts_at', stockholmToUtc(addDays(monday, 7), '00:00').toISOString())
    .order('starts_at')
  const days = weekDays(monday).map((day, i) => ({
    day, label: `${WEEKDAY_LABELS[i]} ${formatDayLabel(day)}`,
    slots: (slots ?? []).filter(s => stockholmParts(new Date(s.starts_at)).day === day)
      .map(s => ({ id: s.id, startsAt: s.starts_at, time: stockholmParts(new Date(s.starts_at)).time })),
  }))

  return (
    <div className="space-y-6">
      {header}
      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle icon="chat">Välj en tid</CardTitle>
          <div className="flex items-center gap-2 text-sm">
            {offset > 0
              ? <Link href={`/startsamtal?vecka=${offset - 1}`} className={buttonClassName('secondary', 'px-3!')}>← Föregående vecka</Link>
              : <span className={buttonClassName('secondary', 'px-3! opacity-40')}>← Föregående vecka</span>}
            {offset < WEEKS_AHEAD - 1
              ? <Link href={`/startsamtal?vecka=${offset + 1}`} className={buttonClassName('secondary', 'px-3!')}>Nästa vecka →</Link>
              : <span className={buttonClassName('secondary', 'px-3! opacity-40')}>Nästa vecka →</span>}
          </div>
        </div>
        <p className="text-sm text-gray-500">Måndag–fredag 08.00–17.00. Lediga tider är markerade.</p>
        <BookSlots days={days} />
      </Card>
    </div>
  )
}
