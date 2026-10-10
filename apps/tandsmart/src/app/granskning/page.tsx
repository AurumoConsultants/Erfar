import Link from 'next/link'
import Card from '@/components/ui/Card'
import { buttonClassName } from '@/components/ui/Button'
import StatusBadge from '@/components/StatusBadge'
import { requireDentist } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { SERVICE_LABELS, STATUS_LABELS, type CaseService, type CaseStatus } from '@/lib/cases'

const TABS: CaseStatus[] = ['inskickat', 'under_granskning', 'besvarat', 'avslutat']

export default async function ReviewQueuePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireDentist()
  const { status: statusParam } = await searchParams
  const showAll = statusParam === 'alla'
  const status = TABS.includes(statusParam as CaseStatus) ? (statusParam as CaseStatus) : null

  const supabase = await createClient()
  const { data: all } = await supabase
    .from('cases')
    .select('id, title, status, services, clinic_name, created_at, patient:profiles!cases_patient_id_fkey(full_name)')
    .order('created_at', { ascending: true })

  const cases = (all ?? []) as unknown as {
    id: string; title: string; status: CaseStatus; services: CaseService[]; clinic_name: string | null
    created_at: string; patient: { full_name: string } | null
  }[]
  const open = cases.filter(c => c.status === 'inskickat' || c.status === 'under_granskning')
  // Open cases oldest first (work queue); "Alla" newest first (archive view).
  const shown = showAll ? [...cases].reverse() : status ? cases.filter(c => c.status === status) : open
  const tabClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full ${active ? 'bg-accent-600 text-white' : 'bg-white border border-gray-200 hover:border-accent-300'}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Granskning</h1>
        <p className="text-sm text-gray-500 mt-1">
          {showAll ? `${cases.length} ärenden totalt, nyast först.` : `${open.length} öppna ärenden, äldst först.`} Klicka på ett ärende för att öppna det.
        </p>
      </div>

      <nav className="flex gap-2 flex-wrap text-sm">
        <Link href="/granskning" className={tabClass(!status && !showAll)}>
          Öppna ({open.length})
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
          return (
            <Link key={c.id} href={`/granskning/${c.id}`} className="block">
              <Card className="px-4 py-3 hover:border-accent-300 hover:shadow-sm transition flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {c.patient?.full_name} · {c.services.map(s => SERVICE_LABELS[s]).join(' · ')}
                    {c.clinic_name && ` — ${c.clinic_name}`}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <StatusBadge status={c.status} />
                    <p className={`text-xs mt-1 ${days >= 3 && c.status !== 'besvarat' && c.status !== 'avslutat' ? 'text-red-600' : 'text-gray-400'}`}>
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
