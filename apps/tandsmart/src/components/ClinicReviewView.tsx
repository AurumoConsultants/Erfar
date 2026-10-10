import Badge from '@/components/ui/Badge'
import { CLINIC_RATING_LABELS } from '@/lib/cases'
import type { ClinicReviewRow } from '@/lib/caseData'

const DIMENSIONS = [
  { key: 'finance', label: 'Ekonomi' },
  { key: 'ivo', label: 'IVO & tillsyn' },
  { key: 'reputation', label: 'Rykte & omdömen' },
] as const

export default function ClinicReviewView({ review }: { review: ClinicReviewRow }) {
  return (
    <div className="space-y-3">
      {DIMENSIONS.map(d => {
        const rating = review[`${d.key}_rating`]
        const note = review[`${d.key}_note`]
        return (
          <div key={d.key}>
            <p className="text-sm font-medium flex items-center gap-2">
              {d.label}
              <Badge tone={CLINIC_RATING_LABELS[rating].tone}>{CLINIC_RATING_LABELS[rating].label}</Badge>
            </p>
            {note && <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{note}</p>}
          </div>
        )
      })}
      <p className="text-xs text-gray-400">Bedömd {new Date(review.reviewed_at).toLocaleDateString('sv-SE')}</p>
    </div>
  )
}
