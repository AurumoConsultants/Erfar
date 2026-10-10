'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Field, { fieldInputClassName } from '@/components/ui/Field'
import { FILE_KIND_LABELS, MAX_FILE_BYTES, type CaseFileKind } from '@/lib/cases'

interface Picked { key: string; file: File; kind: CaseFileKind }

const ACCEPT = 'application/pdf,image/*,.dcm,.zip,.tif,.tiff'

function guessKind(file: File): CaseFileKind {
  const name = file.name.toLowerCase()
  if (name.endsWith('.dcm') || file.type.startsWith('image/') || /rtg|rontgen|röntgen|xray|bitewing|opg/.test(name)) return 'rontgen'
  return 'journal'
}

export default function ClinicUploadForm({ token }: { token: string }) {
  const [files, setFiles] = useState<Picked[]>([])
  const [senderName, setSenderName] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<number | null>(null)

  function add(list: FileList | null) {
    if (!list) return
    const picked = Array.from(list)
    const tooBig = picked.filter(f => f.size > MAX_FILE_BYTES)
    setError(tooBig.length ? `${tooBig.map(f => f.name).join(', ')} är större än 20 MB — dela upp eller zippa.` : null)
    setFiles(prev => [...prev, ...picked.filter(f => f.size <= MAX_FILE_BYTES).map(file => ({ key: crypto.randomUUID(), file, kind: guessKind(file) }))])
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!senderName.trim()) return setError('Ange ditt namn.')
    if (files.length === 0) return setError('Välj minst en fil.')
    setBusy(true)
    const supabase = createClient()
    const uploaded: { path: string; name: string; mimeType: string; kind: CaseFileKind }[] = []

    for (const [i, p] of files.entries()) {
      setProgress(`Laddar upp ${i + 1} av ${files.length}: ${p.file.name}`)
      const res = await fetch(`/api/klinik/${token}/upload-url`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: p.file.name, mimeType: p.file.type, size: p.file.size }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setBusy(false); setProgress(''); return setError(json.error ?? `Kunde inte ladda upp ${p.file.name}.`) }
      const { error: upErr } = await supabase.storage.from('case-files')
        .uploadToSignedUrl(json.path, json.uploadToken, p.file, { contentType: p.file.type || 'application/octet-stream' })
      if (upErr) { setBusy(false); setProgress(''); return setError(`Kunde inte ladda upp ${p.file.name}. Försök igen.`) }
      uploaded.push({ path: json.path, name: p.file.name, mimeType: p.file.type || 'application/octet-stream', kind: p.kind })
    }

    setProgress('Sparar…')
    const res = await fetch(`/api/klinik/${token}/complete`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderName: senderName.trim(), files: uploaded }),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    setProgress('')
    if (!res.ok) return setError(json.error ?? 'Kunde inte spara filerna.')
    setDone(json.saved)
    setFiles([])
  }

  if (done != null) {
    return (
      <Card className="border-green-300 bg-green-50 space-y-2">
        <h2 className="font-semibold">Tack! {done} fil(er) har skickats.</h2>
        <p className="text-sm text-gray-700">Patienten och den granskande tandläkaren har fått besked. Ni kan stänga sidan.</p>
        <Button variant="secondary" onClick={() => setDone(null)}>Skicka fler filer</Button>
      </Card>
    )
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <h2 className="font-semibold">Ladda upp</h2>
        <div>
          <input type="file" multiple accept={ACCEPT} onChange={e => { add(e.target.files); e.target.value = '' }}
            className="block text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent-100 file:text-accent-800 file:font-medium" />
          <p className="text-xs text-gray-400 mt-1">PDF, bilder, DICOM (.dcm) eller ZIP. Max 20 MB per fil.</p>
        </div>
        {files.map(f => (
          <div key={f.key} className="flex items-center gap-3 text-sm">
            <span className="flex-1 truncate">{f.file.name}</span>
            <select value={f.kind} aria-label={`Typ av dokument för ${f.file.name}`}
              onChange={e => setFiles(prev => prev.map(p => p.key === f.key ? { ...p, kind: e.target.value as CaseFileKind } : p))}
              className={fieldInputClassName('w-auto')}>
              {Object.entries(FILE_KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button type="button" onClick={() => setFiles(prev => prev.filter(p => p.key !== f.key))}
              className="text-gray-400 hover:text-red-600" aria-label={`Ta bort ${f.file.name}`}>✕</button>
          </div>
        ))}
        <Field label="Ditt namn och roll" htmlFor="sender" hint="T.ex. ”Anna Berg, tandsköterska”. Visas för patienten.">
          <input id="sender" value={senderName} maxLength={120} onChange={e => setSenderName(e.target.value)} className={fieldInputClassName()} />
        </Field>
        {progress && <p className="text-sm text-gray-600">{progress}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>{busy ? 'Skickar…' : 'Skicka till Tandsmart'}</Button>
        </div>
      </form>
    </Card>
  )
}
