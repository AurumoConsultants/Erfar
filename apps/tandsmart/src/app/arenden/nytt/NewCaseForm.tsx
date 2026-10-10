'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Field, { fieldInputClassName } from '@/components/ui/Field'
import QuoteItemsEditor, { emptyItem, toQuoteItems, type EditableItem } from '@/components/QuoteItemsEditor'
import PriceAnalysisView from '@/components/PriceAnalysisView'
import { analyzeQuote, type ReferencePrice } from '@/lib/pricing'
import {
  ACCEPTED_FILE_TYPES, FILE_KIND_LABELS, MAX_FILE_BYTES, SERVICES,
  type CaseFileKind, type CaseService,
} from '@/lib/cases'

interface PendingFile {
  key: string
  file: File
  kind: CaseFileKind
}

interface Props {
  userId: string
  birthYear: number | null
  references: ReferencePrice[]
}

export default function NewCaseForm({ userId, birthYear, references }: Props) {
  const router = useRouter()
  const [services, setServices] = useState<CaseService[]>(['pris', 'vardplan'])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState('')
  const [clinicName, setClinicName] = useState('')
  const [clinicOrgNumber, setClinicOrgNumber] = useState('')
  const [clinicCity, setClinicCity] = useState('')
  const [treatingDentist, setTreatingDentist] = useState('')
  const [isSpecialist, setIsSpecialist] = useState(false)
  const [priorCosts, setPriorCosts] = useState('')
  const [items, setItems] = useState<EditableItem[]>([emptyItem()])
  const [files, setFiles] = useState<PendingFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const quoteItems = useMemo(() => toQuoteItems(items), [items])
  const analysis = useMemo(() => analyzeQuote(quoteItems, references, {
    isSpecialist, birthYear, priorPeriodCosts: parseFloat(priorCosts) || 0,
  }), [quoteItems, references, isSpecialist, birthYear, priorCosts])

  function toggleService(service: CaseService) {
    setServices(prev => prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service])
  }

  function addFiles(list: FileList | null) {
    if (!list) return
    const tooBig = Array.from(list).filter(f => f.size > MAX_FILE_BYTES)
    if (tooBig.length) setError(`${tooBig.map(f => f.name).join(', ')} är större än 20 MB.`)
    const accepted = Array.from(list).filter(f => f.size <= MAX_FILE_BYTES)
    setFiles(prev => [
      ...prev,
      ...accepted.map(file => ({
        key: crypto.randomUUID(),
        file,
        kind: (file.type === 'application/pdf' ? 'prisforslag' : 'foto') as CaseFileKind,
      })),
    ])
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (services.length === 0) return setError('Välj minst en tjänst.')
    if (files.length === 0 && quoteItems.length === 0) {
      return setError('Ladda upp prisförslaget/vårdplanen eller fyll i åtgärderna, så att vi har något att granska.')
    }

    setSubmitting(true)
    const supabase = createClient()

    const { data: created, error: caseError } = await supabase
      .from('cases')
      .insert({
        patient_id: userId,
        services,
        title: title.trim(),
        patient_description: description.trim() || null,
        patient_questions: questions.trim() || null,
        clinic_name: clinicName.trim() || null,
        clinic_org_number: clinicOrgNumber.trim() || null,
        clinic_city: clinicCity.trim() || null,
        treating_dentist: treatingDentist.trim() || null,
        is_specialist: isSpecialist,
        prior_period_costs: parseFloat(priorCosts) || 0,
      })
      .select('id')
      .single()

    if (caseError || !created) {
      setSubmitting(false)
      return setError('Kunde inte skapa ärendet. Försök igen.')
    }

    if (quoteItems.length) {
      const { error: itemsError } = await supabase.from('case_items').insert(
        quoteItems.map((item, sort) => ({
          case_id: created.id,
          code: item.code,
          description: item.description,
          tooth: item.tooth,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          sort,
        })),
      )
      if (itemsError) {
        setSubmitting(false)
        return setError('Ärendet skapades men åtgärderna kunde inte sparas. Öppna ärendet och försök igen.')
      }
    }

    const failedUploads: string[] = []
    for (const { file, kind } of files) {
      const safeName = file.name.replace(/[^\w.\-]+/g, '_')
      const path = `${userId}/${created.id}/${crypto.randomUUID()}-${safeName}`
      const { error: uploadError } = await supabase.storage.from('case-files').upload(path, file, { contentType: file.type })
      if (uploadError) { failedUploads.push(file.name); continue }
      const { error: rowError } = await supabase.from('case_files').insert({
        case_id: created.id, path, file_name: file.name, mime_type: file.type || 'application/octet-stream', kind,
      })
      if (rowError) failedUploads.push(file.name)
    }

    // Best effort — the case is saved either way; this only emails the dentist.
    await fetch(`/api/arenden/${created.id}/inskickat`, { method: 'POST' }).catch(() => {})

    const query = failedUploads.length ? `?uppladdning=misslyckades` : ''
    router.push(`/arenden/${created.id}${query}`)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card className="space-y-4">
        <h2 className="font-semibold">1. Vad vill du ha hjälp med?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SERVICES.map(s => (
            <label key={s.value}
              className={`border rounded-lg p-3 cursor-pointer text-sm ${services.includes(s.value) ? 'border-accent-500 bg-accent-50' : 'border-gray-200'}`}>
              <span className="flex items-center gap-2 font-medium">
                <input type="checkbox" checked={services.includes(s.value)} onChange={() => toggleService(s.value)} />
                {s.label}
              </span>
              <span className="block text-gray-500 mt-1">{s.description}</span>
            </label>
          ))}
        </div>
        <Field label="Rubrik" htmlFor="title" hint="T.ex. ”Två kronor och en rotfyllning, 38 000 kr”">
          <input id="title" required maxLength={140} value={title} onChange={e => setTitle(e.target.value)}
            className={fieldInputClassName()} />
        </Field>
        <Field label="Beskriv din situation" htmlFor="desc" hint="Besvär, vad tandläkaren sagt, tidigare behandlingar.">
          <textarea id="desc" rows={4} value={description} onChange={e => setDescription(e.target.value)}
            className={fieldInputClassName()} />
        </Field>
        <Field label="Vad vill du särskilt ha svar på?" htmlFor="q">
          <textarea id="q" rows={3} value={questions} onChange={e => setQuestions(e.target.value)}
            className={fieldInputClassName()} />
        </Field>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold">2. Kliniken</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Klinikens namn" htmlFor="cn">
            <input id="cn" value={clinicName} onChange={e => setClinicName(e.target.value)} className={fieldInputClassName()} />
          </Field>
          <Field label="Organisationsnummer" htmlFor="org" hint="Står ofta på kostnadsförslaget. Behövs för klinikkoll.">
            <input id="org" placeholder="556xxx-xxxx" value={clinicOrgNumber}
              onChange={e => setClinicOrgNumber(e.target.value)} className={fieldInputClassName()} />
          </Field>
          <Field label="Ort" htmlFor="city">
            <input id="city" value={clinicCity} onChange={e => setClinicCity(e.target.value)} className={fieldInputClassName()} />
          </Field>
          <Field label="Behandlande tandläkare" htmlFor="td">
            <input id="td" value={treatingDentist} onChange={e => setTreatingDentist(e.target.value)} className={fieldInputClassName()} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isSpecialist} onChange={e => setIsSpecialist(e.target.checked)} />
          Behandlingen görs inom specialisttandvård
        </label>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold">3. Underlag</h2>
        <div>
          <input type="file" multiple accept={ACCEPTED_FILE_TYPES} onChange={e => { addFiles(e.target.files); e.target.value = '' }}
            className="block text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent-100 file:text-accent-800 file:font-medium" />
          <p className="text-xs text-gray-400 mt-1">PDF eller bild, max 20 MB per fil. Fota gärna kostnadsförslaget med mobilen.</p>
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
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="font-semibold">4. Åtgärder och priser <span className="font-normal text-gray-400">(valfritt men rekommenderat)</span></h2>
          <p className="text-sm text-gray-500 mt-1">Skriv av åtgärdskoderna från kostnadsförslaget så får du en direkt jämförelse.</p>
        </div>
        <QuoteItemsEditor items={items} onChange={setItems} references={references} />
        <Field label="Redan betalt i högkostnadsperioden (kr)" htmlFor="prior" hint="Referenspriskostnad senaste 12 månaderna, om du vet. Annars 0.">
          <input id="prior" inputMode="decimal" placeholder="0" value={priorCosts}
            onChange={e => setPriorCosts(e.target.value)} className={fieldInputClassName('sm:w-48')} />
        </Field>
        {quoteItems.length > 0 && <PriceAnalysisView analysis={analysis} />}
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>{submitting ? 'Skickar…' : 'Skicka till granskning'}</Button>
      </div>
    </form>
  )
}
