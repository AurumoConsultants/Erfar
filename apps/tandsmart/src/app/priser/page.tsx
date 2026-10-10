import type { Metadata } from 'next'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import { buttonClassName } from '@/components/ui/Button'
import CodePriceTable from '@/components/CodePriceTable'
import { CODE_GROUPS, getReferencePrices } from '@/lib/publicPrices'
import { GUIDES } from '@/lib/guides'


export async function generateMetadata(): Promise<Metadata> {
  const year = (await getReferencePrices())[0]?.valid_year ?? new Date().getFullYear()
  return {
    title: `Referenspriser för tandvård ${year} — alla åtgärdskoder | Tandsmart`,
    description: `Sök bland TLV:s referenspriser för tandvård ${year}: vad varje åtgärdskod på ditt kostnadsförslag betyder och vad den brukar kosta.`,
    alternates: { canonical: '/priser' },
  }
}

export default async function PricesPage() {
  const prices = await getReferencePrices()
  const year = prices[0]?.valid_year ?? new Date().getFullYear()
  const groups = Object.entries(CODE_GROUPS)
    .map(([digit, g]) => ({ ...g, rows: prices.filter(p => p.code.startsWith(digit)) }))
    .filter(g => g.rows.length)

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Referenspriser för tandvård {year}</h1>
        <p className="text-gray-600 max-w-3xl">
          Alla åtgärder i tandvården har en kod, och för varje kod fastställer TLV ett referenspris. Det är på referenspriset
          som ditt tandvårdsstöd räknas — tar kliniken mer betalar du skillnaden själv. Klicka på en kod för att se vad
          åtgärden innebär och vad du själv betalar.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/snabbkoll" className={buttonClassName('primary')}>Jämför ditt kostnadsförslag gratis</Link>
        </div>
      </div>

      <Card>
        <h2 className="font-semibold mb-3">Prisguider</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {GUIDES.map(g => (
            <li key={g.slug}><Link href={`/guider/${g.slug}`} className="text-accent-700 hover:underline">{g.title}</Link></li>
          ))}
        </ul>
      </Card>

      <nav aria-label="Åtgärdsgrupper" className="flex flex-wrap gap-2 text-sm">
        {groups.map(g => (
          <a key={g.slug} href={`#${g.slug}`} className="px-3 py-1.5 rounded-full bg-white border border-gray-200 hover:border-accent-300">{g.title}</a>
        ))}
      </nav>

      {groups.map(g => (
        <section key={g.slug} id={g.slug} className="scroll-mt-4">
          <Card className="space-y-3">
            <h2 className="text-xl font-semibold">{g.title}</h2>
            <p className="text-sm text-gray-600">{g.text}</p>
            <CodePriceTable rows={g.rows} />
          </Card>
        </section>
      ))}

      <p className="text-xs text-gray-500">
        Källa: TLV:s referenspriser för allmän- och specialisttandvård från 1 januari {year}. Kliniker sätter sina egna priser.
      </p>
    </div>
  )
}
