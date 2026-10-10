import Link from 'next/link'
import { formatKr } from '@/lib/pricing'
import type { PublicReferencePrice } from '@/lib/publicPrices'

// Table of åtgärdskoder with TLV referenspris, each linking to its code page.
export default function CodePriceTable({ rows }: { rows: PublicReferencePrice[] }) {
  if (rows.length === 0) return null
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b-2 border-accent-200">
            <th className="py-2 pr-3 font-medium">Kod</th>
            <th className="py-2 pr-3 font-medium">Åtgärd</th>
            <th className="py-2 pr-3 font-medium text-right whitespace-nowrap">Referenspris</th>
            <th className="py-2 font-medium text-right whitespace-nowrap hidden sm:table-cell">Specialist</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.code} className="border-b border-gray-100 align-top hover:bg-accent-50/60 transition">
              <td className="py-2 pr-3 font-mono">
                <Link href={`/priser/${r.code}`} className="text-accent-700 hover:underline">{r.code}</Link>
              </td>
              <td className="py-2 pr-3">
                <Link href={`/priser/${r.code}`} className="hover:underline">{r.description}</Link>
              </td>
              <td className="py-2 pr-3 text-right whitespace-nowrap font-semibold text-brand-navy">{r.price_general != null ? formatKr(r.price_general) : '—'}</td>
              <td className="py-2 text-right whitespace-nowrap text-gray-500 hidden sm:table-cell">{r.price_specialist != null ? formatKr(r.price_specialist) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
