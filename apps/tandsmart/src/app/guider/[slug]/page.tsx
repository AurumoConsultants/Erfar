import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Card from '@/components/ui/Card'
import { buttonClassName } from '@/components/ui/Button'
import CodePriceTable from '@/components/CodePriceTable'
import { getGuide } from '@/lib/guides'
import { getReferencePrices, siteUrl } from '@/lib/publicPrices'


type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getGuide((await params).slug)
  if (!guide) return {}
  return { title: `${guide.title} | Tandsmart`, description: guide.description, alternates: { canonical: `/guider/${guide.slug}` } }
}

export default async function GuidePage({ params }: Props) {
  const guide = getGuide((await params).slug)
  if (!guide) notFound()

  const prices = guide.codes.length ? await getReferencePrices().catch(() => []) : []
  const rows = guide.codes.map(c => prices.find(p => p.code === c)).filter(r => r != null)
  const year = rows[0]?.valid_year

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: `${siteUrl()}/guider/${guide.slug}`,
    inLanguage: 'sv-SE',
    mainEntity: guide.sections.map(s => ({
      '@type': 'Question',
      name: s.heading,
      acceptedAnswer: { '@type': 'Answer', text: s.paragraphs.join(' ') },
    })),
  }

  return (
    <article className="space-y-6 max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-sm text-gray-500"><Link href="/guider" className="hover:underline">Prisguider</Link></nav>
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">{guide.title}</h1>
        <p className="text-lg text-gray-600">{guide.intro}</p>
      </header>

      {rows.length > 0 && (
        <Card className="space-y-3">
          <h2 className="font-semibold">Referenspriser{year ? ` ${year}` : ''}</h2>
          <CodePriceTable rows={rows} />
          <p className="text-xs text-gray-500">Källa: TLV. Kliniken sätter sitt eget pris — tandvårdsstödet räknas på referenspriset.</p>
        </Card>
      )}

      {guide.sections.map(s => (
        <section key={s.heading} className="space-y-2">
          <h2 className="text-xl font-semibold">{s.heading}</h2>
          {s.paragraphs.map((p, i) => <p key={i} className="text-gray-700">{p}</p>)}
        </section>
      ))}

      {guide.questions.length > 0 && (
        <Card className="bg-accent-50 border-accent-200">
          <h2 className="font-semibold mb-2">Frågor att ställa till din tandläkare</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">{guide.questions.map(q => <li key={q}>{q}</li>)}</ul>
        </Card>
      )}

      <Card className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <p className="text-sm text-gray-700">
          Har du fått ett kostnadsförslag? Jämför det gratis, eller låt en legitimerad tandläkare granska hela vårdplanen.
        </p>
        <div className="flex gap-2 shrink-0">
          <Link href="/snabbkoll" className={buttonClassName('secondary')}>Snabbkoll</Link>
          <Link href="/arenden/nytt" className={buttonClassName('primary')}>Få en bedömning</Link>
        </div>
      </Card>

      <p className="text-xs text-gray-500">Informationen är allmän och ersätter inte en bedömning av din egen munhälsa.</p>
    </article>
  )
}
