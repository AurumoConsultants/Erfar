import Badge from '@/components/ui/Badge'
import { STATUS_LABELS, type CaseStatus } from '@/lib/cases'

export default function StatusBadge({ status }: { status: CaseStatus }) {
  const { label, tone } = STATUS_LABELS[status]
  return <Badge tone={tone}>{label}</Badge>
}
