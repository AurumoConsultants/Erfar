import Link from 'next/link'
import { redirect } from 'next/navigation'
import Card from '@/components/ui/Card'
import { buttonClassName } from '@/components/ui/Button'
import StatusBadge from '@/components/StatusBadge'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { SERVICE_LABELS, type CaseService, type CaseStatus } from '@/lib/cases'

export default async function MyCasesPage() {
  const profile = await requireProfile()
  if (profile.role === 'tandlakare') redirect('/granskning')

  const supabase = await createClient()
  const { data: cases } = await supabase
    .from('cases')
    .select('id, title, status, services, clinic_name, created_at')
    .eq('patient_id', profile.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mina ärenden</h1>
          <p className="text-gray-500 text-sm mt-1">Hej {profile.full_name}</p>
        </div>
        <Link href="/arenden/nytt" className={buttonClassName('primary')}>Nytt ärende</Link>
      </div>

      <div className="space-y-2">
        {(cases ?? []).map(c => (
          <Link key={c.id} href={`/arenden/${c.id}`} className="block">
            <Card className="px-4 py-3 hover:border-accent-300 transition flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {(c.services as CaseService[]).map(s => SERVICE_LABELS[s]).join(' · ')}
                  {c.clinic_name && ` — ${c.clinic_name}`}
                  {' · '}{new Date(c.created_at).toLocaleDateString('sv-SE')}
                </p>
              </div>
              <StatusBadge status={c.status as CaseStatus} />
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
