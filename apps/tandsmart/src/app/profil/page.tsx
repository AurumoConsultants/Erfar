import Card from '@/components/ui/Card'
import CardTitle from '@/components/ui/CardTitle'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import { buttonClassName } from '@/components/ui/Button'
import VideoMeetingList from '@/components/video/VideoMeetingList'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { bankIdConfigured, bankIdEnabled } from '@/lib/bankid'
import { MEETING_COLUMNS, hasBankIdSession, type VideoMeeting } from '@/lib/video'

// The signed-in user's profile: BankID identity and video consultations
// with their recordings.
export default async function ProfilePage() {
  const profile = await requireProfile()
  const supabase = await createClient()
  const [{ data: identity }, { data: meetings }, bankIdSession] = await Promise.all([
    supabase.from('profiles').select('personnummer, bankid_name, bankid_verified_at').eq('id', profile.id).single(),
    profile.role === 'patient'
      ? supabase.from('video_meetings').select(MEETING_COLUMNS).eq('patient_id', profile.id).order('scheduled_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    hasBankIdSession(profile.id),
  ])
  const pnr = identity?.personnummer as string | null
  const masked = pnr ? `${pnr.slice(0, 8)}-****` : null

  return (
    <div className="space-y-6">
      <PageHeader icon="doctor" eyebrow="Min profil" title={profile.full_name}>{profile.email}</PageHeader>

      {bankIdEnabled() && (
      <Card className="space-y-4">
        <CardTitle icon="doctor">BankID</CardTitle>
        {identity?.bankid_verified_at ? (
          <div className="flex items-center gap-3 flex-wrap text-sm">
            <Badge tone="success">Verifierad med BankID</Badge>
            <span>{identity.bankid_name} · {masked}</span>
            {bankIdSession
              ? <Badge tone="accent">Inloggad med BankID</Badge>
              : <a href="/auth/bankid?next=/profil" className={buttonClassName('secondary')}>Logga in med BankID</a>}
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <p className="text-gray-600">
              Koppla ditt BankID till kontot. Det krävs för videosamtal med Doktor Sylvia och för att se inspelningarna,
              eftersom de innehåller uppgifter om din hälsa.
            </p>
            {bankIdConfigured()
              ? <a href="/auth/bankid?next=/profil" className={buttonClassName('primary', 'bg-brand-navy!')}>Verifiera med BankID</a>
              : <p className="text-gray-500">Inloggning med BankID är inte aktiverad än.</p>}
          </div>
        )}
      </Card>
      )}

      {profile.role === 'patient' && (
        <Card className="space-y-4">
          <CardTitle icon="chat">Mina videosamtal</CardTitle>
          <VideoMeetingList meetings={(meetings ?? []) as unknown as VideoMeeting[]} canPlay={bankIdSession} />
        </Card>
      )}
    </div>
  )
}
