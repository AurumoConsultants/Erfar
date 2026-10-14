import Badge, { type BadgeTone } from '@/components/ui/Badge'
import { itemLabels } from '@/lib/clinicRequest'
import type { ClinicRequestRow } from '@/lib/caseData'

const fmt = (iso: string) => new Date(iso).toLocaleDateString('sv-SE')

export function clinicRequestState(r: ClinicRequestRow): { label: string; tone: BadgeTone } {
  if (r.status === 'aterkallad') return { label: 'Återkallad', tone: 'neutral' }
  if (r.status === 'uppladdad') return { label: `${r.uploaded_files} fil(er) mottagna`, tone: 'success' }
  if (new Date(r.expires_at) < new Date()) return { label: 'Länken har gått ut', tone: 'neutral' }
  return { label: 'Väntar på kliniken', tone: 'warning' }
}

// Status of the patient's requests to their clinic. Shared by patient and dentist views.
export default function ClinicRequestList({ requests, actions }: {
  requests: ClinicRequestRow[]
  actions?: (r: ClinicRequestRow) => React.ReactNode
}) {
  if (requests.length === 0) return null
  return (
    <ul className="space-y-2 text-sm">
      {requests.map(r => {
        const state = clinicRequestState(r)
        return (
          <li key={r.id} className="border border-gray-200 rounded-lg p-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium">{r.clinic_name} <span className="text-gray-400 font-normal">· {r.clinic_email}</span></p>
              <p className="text-xs text-gray-500">
                {itemLabels(r.requested_items).join(', ')} · begärt {fmt(r.created_at)}
                {r.status === 'skickad' && ` · gäller till ${fmt(r.expires_at)}`}
                {r.uploaded_at && ` · senast ${fmt(r.uploaded_at)}${r.uploaded_by_name ? ` av ${r.uploaded_by_name}` : ''}`}
              </p>
              {!r.email_sent && r.status === 'skickad' && (
                <p className="text-xs text-amber-700 mt-1">Mejlet kunde inte skickas automatiskt — länken behöver skickas till kliniken manuellt.</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={state.tone}>{state.label}</Badge>
              {actions?.(r)}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
