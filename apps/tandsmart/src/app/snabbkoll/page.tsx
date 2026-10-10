import { createClient } from '@/lib/supabase/server'
import QuickCheck from './QuickCheck'
import type { ReferencePrice } from '@/lib/pricing'

export const metadata = { title: 'Snabbkoll av tandvårdspris — Tandsmart' }

export default async function QuickCheckPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reference_prices')
    .select('code, description, price_general, price_specialist')
    .order('code')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Snabbkoll av ditt prisförslag</h1>
        <p className="text-gray-600 mt-1">
          Skriv in åtgärdskoderna och priserna från ditt kostnadsförslag. Du ser direkt hur de står sig mot
          TLV:s referenspriser och ungefär vad du betalar efter tandvårdsstödet. Inget konto behövs.
        </p>
      </div>
      <QuickCheck references={(data ?? []) as ReferencePrice[]} />
    </div>
  )
}
