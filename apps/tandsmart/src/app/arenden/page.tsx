import Link from 'next/link'
import { redirect } from 'next/navigation'
import Card from '@/components/ui/Card'
import { buttonClassName } from '@/components/ui/Button'
import StatusBadge from '@/components/StatusBadge'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { serviceSummary, type CaseService, type CaseStatus } from '@/lib/cases'
import PageHeader from '@/components/ui/PageHeader'
import Icon, { type IconName } from '@/components/Icon'

const STOCKHOLM = { timeZone: 'Europe/Stockholm' } as const

function Badge({ icon, tone, children }: { icon: IconName; tone: 'red' | 'navy' | 'accent'; children: React.ReactNode }) {
  const colors = { red: 'bg-red-600', navy: 'bg-brand-navy', accent: 'bg-accent-600' }[tone]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${colors} px-2.5 py-0.5 text-xs font-bold text-white shadow-sm`}>
      <Icon name={icon} className="h-3.5 w-3.5" />
      {children}
    </span>
  )
}

export default async function MyCasesPage() {
  const profile = await requireProfile()
  if (profile.role === 'tandlakare') redirect('/granskning')

  const supabase = await createClient()
  const [{ data: cases }, { data: unreadRows }, { data: reads }, { data: meetings }] = await Promise.all([
    supabase.from('cases')
      .select('id, title, status, services, clinic_name, created_at, answered_at')
      .eq('patient_id', profile.id)
      .order('created_at', { ascending: false }),
    supabase.rpc('unread_message_counts'),
    supabase.from('case_message_reads').select('case_id, last_read_at').eq('profile_id', profile.id),
    supabase.from('video_meetings').select('case_id, scheduled_at, duration_minutes')
      .eq('patient_id', profile.id).eq('status', 'bokad').order('scheduled_at'),
  ])
  // What the dentist has done since the patient last opened each case.
  const unread = new Map(((unreadRows ?? []) as { case_id: string; unread: number }[]).map(r => [r.case_id, r.unread]))
  const lastRead = new Map((reads ?? []).map(r => [r.case_id, r.last_read_at as string]))
  const nextMeeting = new Map<string, string>()
  for (const m of meetings ?? []) {
    const ends = new Date(m.scheduled_at).getTime() + m.duration_minutes * 60_000
    if (ends > Date.now() && !nextMeeting.has(m.case_id)) nextMeeting.set(m.case_id, m.scheduled_at)
  }

  return (
    <div className="space-y-6">
      <PageHeader icon="folder" eyebrow={`Hej ${profile.full_name}`} title="Mina ärenden"
        actions={<Link href="/arenden/nytt" className={buttonClassName('primary')}>+ Nytt ärende</Link>}>
        Följ dina ärenden och läs tandläkarens bedömningar.
      </PageHeader>

      <div className="space-y-2">
        {(cases ?? []).map(c => (
          <Link key={c.id} href={`/arenden/${c.id}`} className="block">
            <Card className="px-4 py-3 border-l-4 border-l-accent-500 hover:border-accent-300 hover:shadow-md transition flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-brand font-semibold text-brand-navy">{c.title}</p>
                  {(unread.get(c.id) ?? 0) > 0 && (
                    <Badge icon="chat" tone="red">
                      {unread.get(c.id)} {unread.get(c.id) === 1 ? 'nytt meddelande' : 'nya meddelanden'}
                    </Badge>
                  )}
                  {c.answered_at && (!lastRead.has(c.id) || new Date(c.answered_at) > new Date(lastRead.get(c.id)!)) && (
                    <Badge icon="doctor" tone="accent">Nytt omdöme</Badge>
                  )}
                  {nextMeeting.has(c.id) && (
                    <Badge icon="video" tone="navy">
                      Videosamtal {new Date(nextMeeting.get(c.id)!).toLocaleString('sv-SE', { ...STOCKHOLM, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {serviceSummary(c.services as CaseService[])}
                  {c.clinic_name && ` — ${c.clinic_name}`}
                  {' · '}{new Date(c.created_at).toLocaleDateString('sv-SE')}
                </p>
              </div>
              <div className="shrink-0"><StatusBadge status={c.status as CaseStatus} /></div>
            </Card>
          </Link>
        ))}
        {(cases ?? []).length === 0 && (
          <Card className="text-center text-gray-500 py-10">
            Du har inga ärenden ännu. Skapa ett för att få ditt prisförslag granskat.
          </Card>
        )}
      </div>
    </div>
  )
}
