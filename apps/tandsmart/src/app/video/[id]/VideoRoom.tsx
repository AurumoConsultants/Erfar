'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

// Embeds the Whereby room once the patient has consented to the recording.
export default function VideoRoom({ meetingId, roomUrl, needsConsent, isDentist }: {
  meetingId: string; roomUrl: string; needsConsent: boolean; isDentist: boolean
}) {
  const [consented, setConsented] = useState(!needsConsent)
  const [checked, setChecked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function consent() {
    setBusy(true)
    const res = await fetch(`/api/video/${meetingId}/samtycke`, { method: 'POST' })
    setBusy(false)
    if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? 'Något gick fel.')
    setConsented(true)
  }

  if (!consented) {
    return (
      <Card className="space-y-4">
        <p className="text-sm text-gray-700">
          Samtalet spelas in och sparas under <strong>Min profil</strong> så att du kan se det igen. Inspelningen är en del
          av din vårddokumentation och visas bara för dig och granskande tandläkare. Du kan be om att få den raderad.
        </p>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} className="mt-1" />
          Jag samtycker till att videosamtalet spelas in och sparas i min profil.
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={consent} disabled={!checked || busy}>{busy ? 'Ansluter…' : 'Anslut till samtalet'}</Button>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {isDentist && (
        <p className="text-sm text-gray-600">Starta inspelningen när patienten har anslutit (inspelningsknappen i rummet).</p>
      )}
      <iframe src={roomUrl} title="Videosamtal" allow="camera; microphone; fullscreen; speaker; display-capture; autoplay; compute-pressure"
        className="w-full h-[75vh] min-h-[480px] rounded-2xl border border-gray-200 bg-black" />
    </div>
  )
}
