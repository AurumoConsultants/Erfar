import { createClient } from '@/lib/supabase/server'
import QuickCheck from './QuickCheck'
import type { ReferencePrice } from '@/lib/pricing'
import PageHeader from '@/components/ui/PageHeader'

export const metadata = { title: 'Snabbkoll av tandvårdspris — Tandsmart' }

export default async function QuickCheckPage({ searchParams }: { searchParams: Promise<{ kod?: string }> }) {
  const { kod } = await searchParams
  const supabase = await createClient()
  const { data } = await supabase
    .from('reference_prices')
    .select('code, description, price_general, price_specialist')
    .order('code')

  return (
    <div className="space-y-6">
      <PageHeader icon="calculator" eyebrow="Gratis · inget konto behövs" title="Snabbkoll av ditt prisförslag">
        Skriv in åtgärdskoderna och priserna från ditt kostnadsförslag. Du ser direkt hur de står sig mot
        TLV:s referenspriser och ungefär vad du betalar efter tandvårdsstödet.
      </PageHeader>
      <QuickCheck references={(data ?? []) as ReferencePrice[]} initialCode={kod?.replace(/\D/g, '').slice(0, 4) || undefined} />
    </div>
  )
}
