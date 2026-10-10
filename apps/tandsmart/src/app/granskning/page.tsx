import Link from 'next/link'
import Card from '@/components/ui/Card'
import { buttonClassName } from '@/components/ui/Button'
import StatusBadge from '@/components/StatusBadge'
import Badge from '@/components/ui/Badge'
import { requireDentist } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { serviceSummary, STATUS_LABELS, type CaseService, type CaseStatus } from '@/lib/cases'
import PageHeader from '@/components/ui/PageHeader'
import Icon from '@/components/Icon'

const TABS: CaseStatus[] = ['inskickat', 'under_granskning', 'komplettering', 'besvarat', 'avslutat']

export default async function ReviewQueuePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireDentist()
  const { status: statusParam } = await searchParams
  const showAll = statusParam === 'alla'
  const showUnread = statusParam === 'olasta'
  const status = TABS.includes(statusParam as CaseStatus) ? (statusParam as CaseStatus) : null

  const supabase = await createClient()
  const { data: all } = await supabase
    .from('cases')
    .select('id, title, status, services, clinic_name, created_at, info_requested_at, info_answered_at, patient:profiles!cases_patient_id_fkey(full_name)')
    .order('created_at', { ascending: true })
  const { data: unreadRows } = await supabase.rpc('unread_message_counts')
  const unread = new Map(((unreadRows ?? []) as { case_id: string; unread: number }[]).map(r => [r.case_id, r.unread]))

  const cases = (all ?? []) as unknown as {
    id: string; title: string; status: CaseStatus; services: CaseService[]; clinic_name: string | null
    created_at: string; info_requested_at: string | null; info_answered_at: string | null
    patient: { full_name: string } | null
  }[]
  const open = cases.filter(c => c.status === 'inskickat' || c.status === 'under_granskning')
  // Open cases oldest first (work queue); "Alla" newest first (archive view).
  const withUnread = cases.filter(c => unread.has(c.id))
  const shown = showAll ? [...cases].reverse()
    : showUnread ? withUnread
    : status ? cases.filter(c => c.status === status)
    : open
  const tabClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full ${active ? 'bg-accent-600 text-white' : 'bg-white border border-gray-200 hover:border-accent-300'}`

  return (
    <div className="space-y-6">
      <PageHeader icon="inbox" eyebrow="Tandläkarvy" title="Granskning"
        actions={<Link href="/granskning/referenspriser" className={buttonClassName('secondary', 'bg-white')}>Referenspriser</Link>}>
        {showAll ? `${cases.length} ärenden totalt, nyast först.`
          : showUnread ? `${withUnread.length} ärenden med olästa meddelanden.`
          : `${open.length} öppna ärenden, äldst först.`} Klicka på ett ärende för att öppna det.
      </PageHeader>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          ['Nya', cases.filter(c => c.status === 'inskickat').length, 'bg-accent-600 text-white'],
          ['Under granskning', cases.filter(c => c.status === 'under_granskning').length, 'bg-white'],
          ['Väntar på patient', cases.filter(c => c.status === 'komplettering').length, 'bg-white'],
          ['Över 3 dagar', open.filter(c => Date.now() - new Date(c.created_at).getTime() >= 3 * 86_400_000).length, 'bg-white'],
        ] as const).map(([label, count, tone]) => (
          <div key={label} className={`rounded-2xl border border-gray-200 shadow-sm p-4 ${tone}`}>
            <dt className={`text-xs font-medium ${tone.includes('text-white') ? 'text-white/80' : 'text-gray-500'}`}>{label}</dt>
            <dd className={`font-brand font-bold text-3xl mt-1 ${tone.includes('text-white') ? '' : 'text-brand-navy'}`}>{count}</dd>
          </div>
        ))}
      </dl>

      <nav className="flex gap-2 flex-wrap text-sm">
        <Link href="/granskning" className={tabClass(!status && !showAll && !showUnread)}>
          Öppna ({open.length})
        </Link>
        <Link href="/granskning?status=olasta"
          className={`${tabClass(showUnread)} inline-flex items-center gap-1.5 ${!showUnread && withUnread.length ? 'border-red-300! text-red-700' : ''}`}>
          {withUnread.length > 0 && <span aria-hidden className={`h-2 w-2 rounded-full ${showUnread ? 'bg-white' : 'bg-red-500'}`} />}
          Olästa meddelanden ({withUnread.length})
        </Link>
        <Link href="/granskning?status=alla" className={tabClass(showAll)}>
          Alla ärenden ({cases.length})
        </Link>
        {TABS.map(t => (
          <Link key={t} href={`/granskning?status=${t}`} className={tabClass(status === t)}>
            {STATUS_LABELS[t].label} ({cases.filter(c => c.status === t).length})
          </Link>
        ))}
      </nav>

      <div className="space-y-2">
        {shown.map(c => {
          const days = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86_400_000)
          const unreadCount = unread.get(c.id) ?? 0
          return (
            <Link key={c.id} href={`/granskning/${c.id}`} className="block">
              <Card className={`px-4 py-3 border-l-4 ${days >= 3 && (c.status === 'inskickat' || c.status === 'under_granskning') ? 'border-l-red-500' : 'border-l-accent-500'} hover:border-accent-300 hover:shadow-md transition flex items-center justify-between gap-3`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-brand font-semibold text-brand-navy">{c.title}</p>
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                        <Icon name="chat" className="h-3.5 w-3.5" />
                        {unreadCount} {unreadCount === 1 ? 'oläst meddelande' : 'olästa meddelanden'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {c.patient?.full_name} · {serviceSummary(c.services)}
                    {c.clinic_name && ` — ${c.clinic_name}`}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    {c.status === 'under_granskning' && c.info_answered_at && c.info_requested_at && c.info_answered_at >= c.info_requested_at
                      ? <Badge tone="success">Komplettering inkommen</Badge>
                      : <StatusBadge status={c.status} />}
                    <p className={`text-xs mt-1 ${days >= 3 && (c.status === 'inskickat' || c.status === 'under_granskning') ? 'text-red-600' : 'text-gray-400'}`}>
                      {days === 0 ? 'idag' : `${days} d sedan`}
                    </p>
                  </div>
                  <span className={buttonClassName('secondary', 'hidden sm:inline-flex')}>Öppna ärende →</span>
                </div>
              </Card>
            </Link>
          )
        })}
        {shown.length === 0 && <Card className="text-center text-gray-500 py-10">Inga ärenden här.</Card>}
      </div>
    </div>
  )
}
