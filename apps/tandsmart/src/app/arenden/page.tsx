import Link from 'next/link'
import { redirect } from 'next/navigation'
import Card from '@/components/ui/Card'
import { buttonClassName } from '@/components/ui/Button'
import StatusBadge from '@/components/StatusBadge'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { serviceSummary, type CaseService, type CaseStatus } from '@/lib/cases'
import PageHeader from '@/components/ui/PageHeader'

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
      <PageHeader icon="folder" eyebrow={`Hej ${profile.full_name}`} title="Mina ärenden"
        actions={<Link href="/arenden/nytt" className={buttonClassName('primary')}>+ Nytt ärende</Link>}>
        Följ dina ärenden och läs tandläkarens bedömningar.
      </PageHeader>

      <div className="space-y-2">
        {(cases ?? []).map(c => (
          <Link key={c.id} href={`/arenden/${c.id}`} className="block">
            <Card className="px-4 py-3 border-l-4 border-l-accent-500 hover:border-accent-300 hover:shadow-md transition flex items-center justify-between gap-3">
              <div>
                <p className="font-brand font-semibold text-brand-navy">{c.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {serviceSummary(c.services as CaseService[])}
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
