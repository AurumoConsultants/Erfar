import { redirect } from 'next/navigation'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { ReferencePrice } from '@/lib/pricing'
import NewCaseForm from './NewCaseForm'
import PageHeader from '@/components/ui/PageHeader'

export default async function NewCasePage() {
  const profile = await requireProfile()
  if (profile.role === 'tandlakare') redirect('/granskning')

  const supabase = await createClient()
  const { data } = await supabase
    .from('reference_prices')
    .select('code, description, price_general, price_specialist')
    .order('code')

  return (
    <div className="space-y-6">
      <PageHeader icon="plus" eyebrow="Fyra korta steg" title="Nytt ärende">
        Berätta vad du vill ha hjälp med och ladda upp underlaget från din tandläkare. Ju mer vi får se,
        desto bättre blir bedömningen.
      </PageHeader>
      <NewCaseForm
        userId={profile.id}
        birthYear={profile.birth_year}
        references={(data ?? []) as ReferencePrice[]}
      />
    </div>
  )
}
