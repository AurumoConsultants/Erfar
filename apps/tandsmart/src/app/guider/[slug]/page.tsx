import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Card from '@/components/ui/Card'
import { buttonClassName } from '@/components/ui/Button'
import CodePriceTable from '@/components/CodePriceTable'
import { getGuide } from '@/lib/guides'
import { getReferencePrices, siteUrl } from '@/lib/publicPrices'
import CtaBand from '@/components/ui/CtaBand'
import CardTitle from '@/components/ui/CardTitle'
import PageHeader from '@/components/ui/PageHeader'


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
      <PageHeader icon="book" eyebrow="Prisguide" title={guide.title}>
        <p className="text-base">{guide.intro}</p>
      </PageHeader>

      {rows.length > 0 && (
        <Card className="space-y-3">
          <CardTitle icon="table">Referenspriser{year ? ` ${year}` : ''}</CardTitle>
          <CodePriceTable rows={rows} />
          <p className="text-xs text-gray-500">Källa: TLV. Kliniken sätter sitt eget pris — tandvårdsstödet räknas på referenspriset.</p>
        </Card>
      )}

      {guide.sections.map(s => (
        <section key={s.heading} className="space-y-2 border-l-4 border-accent-300 pl-4">
          <h2 className="text-xl font-bold">{s.heading}</h2>
          {s.paragraphs.map((p, i) => <p key={i} className="text-gray-700">{p}</p>)}
        </section>
      ))}

      {guide.questions.length > 0 && (
        <Card className="bg-accent-50 border-accent-200">
          <CardTitle icon="question" className="mb-3">Frågor att ställa till din tandläkare</CardTitle>
          <ul className="list-disc pl-5 space-y-1 text-sm">{guide.questions.map(q => <li key={q}>{q}</li>)}</ul>
        </Card>
      )}

      <CtaBand actions={<>
        <Link href="/snabbkoll" className={buttonClassName('secondary', 'bg-white/10! text-white! border-white/30! hover:bg-white/20!')}>Snabbkoll</Link>
        <Link href="/arenden/nytt" className={buttonClassName('primary', 'bg-accent-500! hover:bg-accent-400!')}>Få en bedömning</Link>
      </>}>
        Har du fått ett kostnadsförslag? Jämför det gratis, eller låt en legitimerad tandläkare granska hela vårdplanen.
      </CtaBand>

      <p className="text-xs text-gray-500">Informationen är allmän och ersätter inte en bedömning av din egen munhälsa.</p>
    </article>
  )
}
