import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import { buttonClassName } from '@/components/ui/Button'
import type { VideoMeeting } from '@/lib/video'

const STATUS = {
  bokad: { label: 'Bokat', tone: 'info' },
  genomford: { label: 'Genomfört', tone: 'success' },
  avbokad: { label: 'Avbokat', tone: 'neutral' },
} as const

export const formatMeetingTime = (iso: string) =>
  new Date(iso).toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm', dateStyle: 'medium', timeStyle: 'short' })

// Meetings with join links and recordings. `actions` lets the dentist view
// add its own controls per meeting.
export default function VideoMeetingList({ meetings, canPlay, actions }: {
  meetings: VideoMeeting[]
  canPlay: boolean
  actions?: (m: VideoMeeting) => React.ReactNode
}) {
  if (meetings.length === 0) return <p className="text-sm text-gray-500">Inga videosamtal bokade.</p>
  return (
    <ul className="space-y-3">
      {meetings.map(m => (
        <li key={m.id} className="rounded-xl border border-gray-200 p-3 space-y-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-brand font-semibold text-brand-navy">{formatMeetingTime(m.scheduled_at)}</p>
              <p className="text-xs text-gray-500">{m.duration_minutes} minuter</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone={STATUS[m.status].tone}>{STATUS[m.status].label}</Badge>
              {m.status === 'bokad' && <Link href={`/video/${m.id}`} className={buttonClassName('primary')}>Gå till samtalet</Link>}
              {actions?.(m)}
            </div>
          </div>
          {m.recordings.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Inspelning{m.recordings.length > 1 ? 'ar' : ''}</p>
              {canPlay
                ? m.recordings.map(r => (
                    <video key={r.id} controls preload="none" className="w-full rounded-lg bg-black aspect-video"
                      src={`/api/video/inspelning/${r.id}`} />
                  ))
                : <p className="text-sm text-gray-500">Logga in med BankID för att spela upp inspelningen.</p>}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
