'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Field, { fieldInputClassName } from '@/components/ui/Field'
import CaseFilePicker from '@/components/CaseFilePicker'
import { uploadCaseFiles, type PendingCaseFile } from '@/lib/uploadCaseFiles'

interface Props {
  caseId: string
  patientId: string
  request: string
  requestedAt: string | null
}

// Shown on the patient's case while the dentist waits for more material.
export default function ComplementForm({ caseId, patientId, request, requestedAt }: Props) {
  const router = useRouter()
  const [files, setFiles] = useState<PendingCaseFile[]>([])
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (files.length === 0 && !comment.trim()) {
      return setError('Ladda upp minst en fil eller skriv en kommentar.')
    }
    setSubmitting(true)
    const supabase = createClient()

    const failed = await uploadCaseFiles(supabase, patientId, caseId, files)
    if (failed.length) {
      setSubmitting(false)
      // Successfully uploaded files stay on the case; keep only the failed ones.
      setFiles(prev => prev.filter(f => failed.includes(f.file.name)))
      return setError(`${failed.join(', ')} kunde inte laddas upp. Försök igen — övriga filer är sparade.`)
    }

    const { error: rpcError } = await supabase.rpc('submit_complement', { p_case_id: caseId, p_comment: comment.trim() || null })
    if (rpcError) {
      setSubmitting(false)
      return setError('Kompletteringen kunde inte skickas. Försök igen.')
    }

    // Best effort — only emails the dentist.
    await fetch(`/api/arenden/${caseId}/komplettering`, { method: 'POST' }).catch(() => {})
    router.refresh()
  }

  return (
    <Card className="border-accent-300 bg-accent-50 space-y-4">
      <div>
        <h2 className="font-semibold text-lg">Tandläkaren behöver mer underlag</h2>
        {requestedAt && (
          <p className="text-xs text-gray-500">Begärt {new Date(requestedAt).toLocaleDateString('sv-SE')}</p>
        )}
      </div>
      <p className="text-sm whitespace-pre-wrap bg-white rounded-lg p-3 border border-accent-200">{request}</p>
      <p className="text-sm text-gray-600">
        Har du inte underlaget själv kan du låta kliniken skicka det direkt — se "Låt kliniken skicka journal och
        röntgen" längre ner. Du kan också begära ut journalen själv; du har rätt att få en kopia.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <CaseFilePicker files={files} onChange={setFiles} onError={setError}
          defaultKind={file => (file.type === 'application/pdf' ? 'journal' : 'rontgen')}
          hint="PDF eller bild, max 20 MB per fil. Ange vad varje fil är, t.ex. röntgenbild eller journalkopia." />
        <Field label="Kommentar (valfritt)" htmlFor="complement-comment">
          <textarea id="complement-comment" rows={3} maxLength={5000} value={comment}
            onChange={e => setComment(e.target.value)} className={fieldInputClassName('bg-white')} />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>{submitting ? 'Skickar…' : 'Skicka komplettering'}</Button>
        </div>
      </form>
    </Card>
  )
}
