import type { Metadata } from 'next'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import { GUIDES } from '@/lib/guides'
import PageHeader from '@/components/ui/PageHeader'

export const metadata: Metadata = {
  title: 'Prisguider för tandvård | Tandsmart',
  description: 'Vad kostar en krona, ett implantat eller en rotfyllning? Guider med aktuella referenspriser och frågor att ställa till din tandläkare.',
  alternates: { canonical: '/guider' },
}

export default function GuidesPage() {
  return (
    <div className="space-y-6">
      <PageHeader icon="book" eyebrow={`${GUIDES.length} guider`} title="Prisguider för tandvård">
        Förstå vad behandlingen kostar och vad du bör fråga om innan du säger ja.
      </PageHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GUIDES.map(g => (
          <Link key={g.slug} href={`/guider/${g.slug}`} className="block">
            <Card className="group h-full border-t-4 border-t-accent-500 hover:-translate-y-0.5 hover:shadow-lg hover:border-accent-300 transition">
              <h2 className="text-lg font-bold">{g.title}</h2>
              <p className="text-sm text-gray-600 mt-2">{g.description}</p>
              <p className="font-brand font-semibold text-accent-700 text-sm mt-3">Läs guiden <span aria-hidden className="inline-block transition group-hover:translate-x-1">→</span></p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
