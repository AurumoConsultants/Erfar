import type { Metadata } from 'next'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import { buttonClassName } from '@/components/ui/Button'
import CodePriceTable from '@/components/CodePriceTable'
import { CODE_GROUPS, getReferencePrices } from '@/lib/publicPrices'
import { GUIDES } from '@/lib/guides'
import CardTitle from '@/components/ui/CardTitle'
import PageHeader from '@/components/ui/PageHeader'


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
      <PageHeader icon="table" eyebrow={`TLV · ${prices.length} åtgärdskoder`} title={`Referenspriser för tandvård ${year}`}
        actions={<Link href="/snabbkoll" className={buttonClassName('primary')}>Jämför ditt förslag gratis</Link>}>
        Alla åtgärder i tandvården har en kod, och för varje kod fastställer TLV ett referenspris. Det är på referenspriset
        som ditt tandvårdsstöd räknas — tar kliniken mer betalar du skillnaden själv. Klicka på en kod för att se vad
        åtgärden innebär och vad du själv betalar.
      </PageHeader>

      <Card>
        <CardTitle icon="book" className="mb-4">Prisguider</CardTitle>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          {GUIDES.map(g => (
            <li key={g.slug}>
              <Link href={`/guider/${g.slug}`}
                className="flex h-full items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 font-medium text-brand-navy hover:border-accent-300 hover:bg-accent-50 transition">
                <span aria-hidden className="text-accent-600">→</span>{g.title}
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <nav aria-label="Åtgärdsgrupper" className="sticky top-16 z-30 -mx-4 px-4 py-2 bg-gray-50/90 backdrop-blur flex flex-wrap gap-2 text-sm font-brand font-semibold">
        {groups.map(g => (
          <a key={g.slug} href={`#${g.slug}`} className="px-3 py-1.5 rounded-full bg-white border border-accent-200 text-accent-800 hover:bg-accent-600 hover:text-white hover:border-accent-600 transition">{g.title}</a>
        ))}
      </nav>

      {groups.map(g => (
        <section key={g.slug} id={g.slug} className="scroll-mt-32">
          <Card className="space-y-3 border-t-4 border-t-accent-500">
            <h2 className="text-xl font-bold">{g.title}</h2>
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
