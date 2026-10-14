import { requireDentist } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import ReferencePriceEditor from './ReferencePriceEditor'

export default async function ReferencePricesPage() {
  await requireDentist()
  const supabase = await createClient()
  const { data } = await supabase
    .from('reference_prices')
    .select('code, description, price_general, price_specialist, valid_year, patient_note')
    .order('code')

  return (
    <div className="space-y-6">
      <PageHeader icon="table" eyebrow="Tandläkarvy" title="Referenspriser">
        <p>
          TLV:s referenspriser som prisjämförelsen bygger på. Läs in hela årets lista med
          {' '}<code className="text-xs bg-gray-100 px-1 rounded">pnpm --filter tandsmart import-referenspriser &lt;fil.xlsx&gt;</code>
          {' '}eller justera enskilda rader här. Klicka på en rad för att redigera den och skriva en förklaring som visas för patienter på <a href="/priser" className="underline">prissidorna</a>.
        </p>
      </PageHeader>
      <ReferencePriceEditor initial={data ?? []} />
    </div>
  )
}
