import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Card from '@/components/ui/Card'
import { buttonClassName } from '@/components/ui/Button'
import CodePriceTable from '@/components/CodePriceTable'
import { analyzeQuote, formatKr, HKS_LOWER, HKS_UPPER } from '@/lib/pricing'
import { getReferencePrice, getReferencePrices, groupOf, siteUrl } from '@/lib/publicPrices'
import { GUIDES } from '@/lib/guides'


type Props = { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const ref = await getReferencePrice(code)
  if (!ref) return { title: 'Åtgärdskoden hittades inte | Tandsmart' }
  const price = ref.price_general != null ? ` Referenspris ${formatKr(ref.price_general)}.` : ''
  return {
    title: `Åtgärd ${ref.code}: ${ref.description} — pris ${ref.valid_year} | Tandsmart`,
    description: `Vad betyder åtgärdskod ${ref.code} (${ref.description}) på ditt kostnadsförslag och vad kostar det?${price} Se vad du själv betalar efter tandvårdsstödet.`,
    alternates: { canonical: `/priser/${ref.code}` },
  }
}

function patientCost(price: number, opts: { priorPeriodCosts?: number; birthYear?: number | null; year: number }) {
  return analyzeQuote(
    [{ code: 'x', description: null, quantity: 1, unitPrice: price }],
    [{ code: 'x', description: '', price_general: price, price_specialist: price }],
    opts,
  ).estimatedPatientCost
}

export default async function CodePage({ params }: Props) {
  const { code } = await params
  const [ref, all] = await Promise.all([getReferencePrice(code), getReferencePrices()])
  if (!ref) notFound()

  const group = groupOf(ref.code)
  const related = all.filter(r => r.code !== ref.code && r.code.charAt(0) === ref.code.charAt(0))
    .sort((a, b) => Math.abs(Number(a.code) - Number(ref.code)) - Math.abs(Number(b.code) - Number(ref.code)))
    .slice(0, 8)
    .sort((a, b) => a.code.localeCompare(b.code))
  const guides = GUIDES.filter(g => g.codes.includes(ref.code))
  const price = ref.price_general ?? ref.price_specialist
  const year = ref.valid_year

  const examples = price != null ? [
    { label: 'Inga tidigare kostnader i din högkostnadsperiod', cost: patientCost(price, { year }) },
    { label: `Du har redan haft ${formatKr(HKS_LOWER)} i kostnader i perioden`, cost: patientCost(price, { year, priorPeriodCosts: HKS_LOWER }) },
    { label: `Du har redan haft över ${formatKr(HKS_UPPER)} i kostnader`, cost: patientCost(price, { year, priorPeriodCosts: HKS_UPPER }) },
    { label: 'Du är 67 år eller äldre (tiotandvården)', cost: patientCost(price, { year, birthYear: year - 67 }) },
  ] : []

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: `Åtgärd ${ref.code}: ${ref.description}`,
    url: `${siteUrl()}/priser/${ref.code}`,
    inLanguage: 'sv-SE',
    about: { '@type': 'MedicalProcedure', name: ref.description },
  }

  return (
    <article className="space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-sm text-gray-500">
        <Link href="/priser" className="hover:underline">Referenspriser</Link>
        {group && <> / <Link href={`/priser#${group.slug}`} className="hover:underline">{group.title}</Link></>}
      </nav>

      <header className="space-y-2">
        <p className="font-mono text-accent-700 font-semibold">Åtgärd {ref.code}</p>
        <h1 className="text-3xl font-bold">{ref.description}</h1>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm text-gray-500">Referenspris allmäntandvård {year}</p>
          <p className="text-3xl font-bold mt-1">{ref.price_general != null ? formatKr(ref.price_general) : '—'}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Referenspris specialisttandvård {year}</p>
          <p className="text-3xl font-bold mt-1">{ref.price_specialist != null ? formatKr(ref.price_specialist) : '—'}</p>
        </Card>
      </div>

      {ref.patient_note && (
        <Card className="bg-accent-50 border-accent-200">
          <h2 className="font-semibold mb-2">Tandläkaren förklarar</h2>
          <p className="text-sm whitespace-pre-wrap">{ref.patient_note}</p>
          <p className="text-xs text-gray-500 mt-2">Sylvia, leg. tandläkare</p>
        </Card>
      )}

      {group && (
        <Card>
          <h2 className="font-semibold mb-2">{group.title}</h2>
          <p className="text-sm text-gray-600">{group.text}</p>
        </Card>
      )}

      {examples.length > 0 && (
        <Card className="space-y-3">
          <h2 className="font-semibold">Vad betalar du själv?</h2>
          <p className="text-sm text-gray-600">
            Om kliniken tar referenspriset, {formatKr(price!)}, och åtgärden görs en gång. Tar kliniken mer betalar du
            skillnaden utöver detta.
          </p>
          <dl className="divide-y divide-gray-100 text-sm">
            {examples.map(e => (
              <div key={e.label} className="flex justify-between gap-4 py-2">
                <dt className="text-gray-600">{e.label}</dt>
                <dd className="font-semibold whitespace-nowrap">{formatKr(e.cost)}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-gray-500">
            Uppskattning enligt <Link href="/guider/hogkostnadsskydd" className="underline">högkostnadsskyddet</Link> och{' '}
            <Link href="/guider/tiotandvarden" className="underline">tiotandvården</Link>. Allmänt tandvårdsbidrag (ATB) är inte avdraget.
          </p>
        </Card>
      )}

      <Card className="bg-accent-50 border-accent-200 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <p className="text-sm text-gray-700">
          Står åtgärd {ref.code} på ditt kostnadsförslag? Jämför klinikens pris med referenspriset — gratis.
        </p>
        <Link href={`/snabbkoll?kod=${ref.code}`} className={buttonClassName('primary', 'shrink-0')}>Jämför ditt pris</Link>
      </Card>

      {guides.length > 0 && (
        <Card>
          <h2 className="font-semibold mb-2">Läs mer</h2>
          <ul className="text-sm space-y-1">
            {guides.map(g => <li key={g.slug}><Link href={`/guider/${g.slug}`} className="text-accent-700 hover:underline">{g.title}</Link></li>)}
          </ul>
        </Card>
      )}

      {related.length > 0 && (
        <Card className="space-y-3">
          <h2 className="font-semibold">Närliggande åtgärder</h2>
          <CodePriceTable rows={related} />
        </Card>
      )}

      <p className="text-xs text-gray-500">Källa: TLV:s referenspriser från 1 januari {year}. Kliniker sätter sina egna priser.</p>
    </article>
  )
}
