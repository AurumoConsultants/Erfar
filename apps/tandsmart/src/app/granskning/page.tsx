import Link from 'next/link'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/StatusBadge'
import { requireDentist } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { SERVICE_LABELS, STATUS_LABELS, type CaseService, type CaseStatus } from '@/lib/cases'

const TABS: CaseStatus[] = ['inskickat', 'under_granskning', 'besvarat', 'avslutat']

export default async function ReviewQueuePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireDentist()
  const { status: statusParam } = await searchParams
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
  const shown = status ? cases.filter(c => c.status === status) : open

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Granskning</h1>
        <p className="text-sm text-gray-500 mt-1">{open.length} öppna ärenden, äldst först.</p>
      </div>

      <nav className="flex gap-2 flex-wrap text-sm">
        <Link href="/granskning" className={`px-3 py-1.5 rounded-full ${!status ? 'bg-accent-600 text-white' : 'bg-white border border-gray-200'}`}>
          Öppna ({open.length})
        </Link>
        {TABS.map(t => (
          <Link key={t} href={`/granskning?status=${t}`}
            className={`px-3 py-1.5 rounded-full ${status === t ? 'bg-accent-600 text-white' : 'bg-white border border-gray-200'}`}>
            {STATUS_LABELS[t].label} ({cases.filter(c => c.status === t).length})
          </Link>
        ))}
      </nav>

      <div className="space-y-2">
        {shown.map(c => {
          const days = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86_400_000)
          return (
            <Link key={c.id} href={`/granskning/${c.id}`} className="block">
              <Card className="px-4 py-3 hover:border-accent-300 transition flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {c.patient?.full_name} · {c.services.map(s => SERVICE_LABELS[s]).join(' · ')}
                    {c.clinic_name && ` — ${c.clinic_name}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={c.status} />
                  <p className={`text-xs mt-1 ${days >= 3 && c.status !== 'besvarat' && c.status !== 'avslutat' ? 'text-red-600' : 'text-gray-400'}`}>
                    {days === 0 ? 'idag' : `${days} d sedan`}
                  </p>
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
