import type { Metadata } from 'next'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import { GUIDES } from '@/lib/guides'

export const metadata: Metadata = {
  title: 'Prisguider för tandvård | Tandsmart',
  description: 'Vad kostar en krona, ett implantat eller en rotfyllning? Guider med aktuella referenspriser och frågor att ställa till din tandläkare.',
  alternates: { canonical: '/guider' },
}

export default function GuidesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Prisguider för tandvård</h1>
        <p className="text-gray-600 mt-2">Förstå vad behandlingen kostar och vad du bör fråga om innan du säger ja.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GUIDES.map(g => (
          <Link key={g.slug} href={`/guider/${g.slug}`} className="block">
            <Card className="h-full hover:border-accent-300 transition">
              <h2 className="font-semibold">{g.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{g.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
