import Badge, { type BadgeTone } from '@/components/ui/Badge'
import { formatKr, HKS_LOWER, type LineFlag, type QuoteAnalysis } from '@/lib/pricing'

const FLAG_LABELS: Record<LineFlag, { label: string; tone: BadgeTone }> = {
  ok: { label: 'Nära referens', tone: 'success' },
  under: { label: 'Under referens', tone: 'success' },
  over: { label: 'Över referens', tone: 'warning' },
  hogt_over: { label: 'Klart över referens', tone: 'error' },
  saknar_referens: { label: 'Referens saknas', tone: 'neutral' },
}

export default function PriceAnalysisView({ analysis }: { analysis: QuoteAnalysis }) {
  if (analysis.lines.length === 0) {
    return <p className="text-sm text-gray-500">Lägg till minst en åtgärd med pris för att se analysen.</p>
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b-2 border-accent-200">
              <th className="py-2 pr-3 font-medium">Åtgärd</th>
              <th className="py-2 pr-3 font-medium text-right">Pris</th>
              <th className="py-2 pr-3 font-medium text-right">Referenspris</th>
              <th className="py-2 font-medium">Bedömning</th>
            </tr>
          </thead>
          <tbody>
            {analysis.lines.map((line, i) => (
              <tr key={i} className="border-b border-gray-100 align-top">
                <td className="py-2 pr-3">
                  <span className="font-mono text-gray-500 mr-2">{line.item.code ?? '—'}</span>
                  {line.item.description ?? line.reference?.description ?? ''}
                  {line.item.quantity > 1 && <span className="text-gray-400"> × {line.item.quantity}</span>}
                </td>
                <td className="py-2 pr-3 text-right whitespace-nowrap">{formatKr(line.lineTotal)}</td>
                <td className="py-2 pr-3 text-right whitespace-nowrap text-gray-500">
                  {line.referenceUnitPrice != null ? formatKr(line.referenceUnitPrice * line.item.quantity) : '—'}
                </td>
                <td className="py-2">
                  <Badge tone={FLAG_LABELS[line.flag].tone}>{FLAG_LABELS[line.flag].label}</Badge>
                  {line.ratio != null && line.flag !== 'ok' && (
                    <span className="text-xs text-gray-500 ml-2">{Math.round((line.ratio - 1) * 100)} %</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
          <dt className="text-gray-500">Totalt enligt förslaget</dt>
          <dd className="font-brand font-bold text-xl text-brand-navy">{formatKr(analysis.total)}</dd>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
          <dt className="text-gray-500">Över referenspris</dt>
          <dd className="font-brand font-bold text-xl text-brand-navy">{formatKr(analysis.aboveReferenceTotal)}</dd>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
          <dt className="text-gray-500">Uppskattat tandvårdsstöd</dt>
          <dd className="font-brand font-bold text-xl text-brand-navy">{formatKr(analysis.estimatedSubsidy)}</dd>
        </div>
        <div className="bg-accent-600 text-white rounded-xl p-3 shadow-md shadow-accent-600/20">
          <dt className="text-white/80">Du betalar ca</dt>
          <dd className="font-brand font-bold text-xl">{formatKr(analysis.estimatedPatientCost)}</dd>
        </div>
      </dl>

      <ul className="text-xs text-gray-500 space-y-1 list-disc pl-5">
        {analysis.scheme === 'tiotandvard' ? (
          <li>Du omfattas av tiotandvården (67 år eller äldre): du betalar 10 % av referenspriset, plus allt som ligger över referenspriset.</li>
        ) : (
          <li>Högkostnadsskyddet ger 50 % av referenspriskostnaden mellan {formatKr(HKS_LOWER)} och 15 000 kr och 85 % därutöver, räknat över en 12-månadersperiod.</li>
        )}
        {analysis.aboveReferenceTotal > 0 && (
          <li>Den del av priset som ligger över referenspriset ger ingen ersättning — den betalar du själv.</li>
        )}
        {analysis.linesWithoutReference > 0 && (
          <li>{analysis.linesWithoutReference} rad(er) saknar referenspris i vår tabell och har räknats som om hela priset ger ersättning.</li>
        )}
        <li>Allmänt tandvårdsbidrag (ATB) är inte avdraget. Detta är en uppskattning — klinikens beräkning är den som gäller.</li>
      </ul>
    </div>
  )
}
