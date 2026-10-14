'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Field, { fieldInputClassName } from '@/components/ui/Field'
import QuoteItemsEditor, { emptyItem, toQuoteItems, type EditableItem } from '@/components/QuoteItemsEditor'
import PriceAnalysisView from '@/components/PriceAnalysisView'
import { analyzeQuote, type ReferencePrice } from '@/lib/pricing'
import { formatOrgNumberInput, normalizeOrgNumber } from '@/lib/orgNumber'
import CaseFilePicker from '@/components/CaseFilePicker'
import { uploadCaseFiles, type PendingCaseFile } from '@/lib/uploadCaseFiles'
import { ADDONS, PACKAGES, formatPrice, type CaseService, type PackageId } from '@/lib/cases'

interface Props {
  userId: string
  birthYear: number | null
  references: ReferencePrice[]
}

// Numbered step heading in the brand style.
function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 text-lg font-bold">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-600 text-white text-sm">{n}</span>
      <span>{children}</span>
    </h2>
  )
}

// One selectable service card: radio for packages, checkbox for add-ons,
// with the price as a badge in the corner.
function ServiceOption({ type, name, checked, onChange, label, description, price }: {
  type: 'radio' | 'checkbox'; name?: string; checked: boolean; onChange: () => void
  label: string; description: string; price: string
}) {
  return (
    <label className={`relative flex flex-col rounded-xl border-2 p-3 pr-4 cursor-pointer text-sm transition ${checked ? 'border-accent-500 bg-accent-50 shadow-sm' : 'border-gray-200 hover:border-accent-300'}`}>
      <span className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-2 font-brand font-semibold text-brand-navy">
          <input type={type} name={name} checked={checked} onChange={onChange} className="accent-accent-600" />
          {label}
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${checked ? 'bg-accent-600 text-white' : 'bg-accent-100 text-accent-800'}`}>
          {price}
        </span>
      </span>
      <span className="block text-gray-500 mt-1.5">{description}</span>
    </label>
  )
}

export default function NewCaseForm({ userId, birthYear, references }: Props) {
  const router = useRouter()
  const [pkg, setPkg] = useState<PackageId>('second_opinion')
  const [addons, setAddons] = useState<CaseService[]>([])
  const services = useMemo<CaseService[]>(
    () => [...(PACKAGES.find(p => p.id === pkg)?.services ?? []), ...addons], [pkg, addons])
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
  const [files, setFiles] = useState<PendingCaseFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const quoteItems = useMemo(() => toQuoteItems(items), [items])
  const analysis = useMemo(() => analyzeQuote(quoteItems, references, {
    isSpecialist, birthYear, priorPeriodCosts: parseFloat(priorCosts) || 0,
  }), [quoteItems, references, isSpecialist, birthYear, priorCosts])

  function toggleAddon(service: CaseService) {
    setAddons(prev => prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service])
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
        clinic_org_number: normalizeOrgNumber(clinicOrgNumber) ?? (clinicOrgNumber.trim() || null),
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

    const failedUploads = await uploadCaseFiles(supabase, userId, created.id, files)

    // Best effort — the case is saved either way; this only emails the dentist.
    await fetch(`/api/arenden/${created.id}/inskickat`, { method: 'POST' }).catch(() => {})

    const query = failedUploads.length ? `?uppladdning=misslyckades` : ''
    router.push(`/arenden/${created.id}${query}`)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card className="space-y-4">
        <StepTitle n={1}>Vad vill du ha hjälp med?</StepTitle>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-gray-700 mb-2">Välj en tjänst</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PACKAGES.map(p => (
              <ServiceOption key={p.id} type="radio" name="package" checked={pkg === p.id} onChange={() => setPkg(p.id)}
                label={p.label} description={p.description} price={formatPrice(p.price)} />
            ))}
          </div>
          <Link href="/startsamtal"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border-2 border-dashed border-accent-300 bg-accent-50/60 p-3 pr-4 text-sm transition hover:border-accent-500 hover:bg-accent-50">
            <span>
              <span className="block font-brand font-semibold text-brand-navy">Osäker? Boka ett gratis startsamtal</span>
              <span className="block text-gray-500 mt-0.5">
                5 minuter med Doktor Sylvia på video. Hon hjälper dig att välja tjänst och komma igång med ärendet.
              </span>
            </span>
            <span className="flex items-center gap-2 shrink-0">
              <span className="rounded-full bg-accent-600 text-white px-2.5 py-0.5 text-xs font-bold">Gratis</span>
              <span className="text-accent-700 font-semibold">Välj tid →</span>
            </span>
          </Link>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-gray-700 mb-2">Tillägg (valfritt)</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ADDONS.map(a => (
              <ServiceOption key={a.service} type="checkbox" checked={addons.includes(a.service)} onChange={() => toggleAddon(a.service)}
                label={a.label} description={a.description} price={`+${formatPrice(a.price)}`} />
            ))}
          </div>
        </fieldset>
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
        <StepTitle n={2}>Kliniken</StepTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Klinikens namn" htmlFor="cn">
            <input id="cn" value={clinicName} onChange={e => setClinicName(e.target.value)} className={fieldInputClassName()} />
          </Field>
          <Field label="Organisationsnummer" htmlFor="org" hint="Står ofta på kostnadsförslaget. Behövs för klinikkoll.">
            <input id="org" placeholder="556xxx-xxxx" inputMode="numeric" value={clinicOrgNumber}
              onChange={e => setClinicOrgNumber(formatOrgNumberInput(e.target.value))} className={fieldInputClassName()} />
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
        <StepTitle n={3}>Underlag</StepTitle>
        <CaseFilePicker files={files} onChange={setFiles} onError={setError}
          defaultKind={file => (file.type === 'application/pdf' ? 'prisforslag' : 'foto')}
          hint="PDF eller bild, max 20 MB per fil. Fota gärna kostnadsförslaget med mobilen." />
      </Card>

      <Card className="space-y-4">
        <div>
          <StepTitle n={4}>Åtgärder och priser <span className="font-sans text-sm font-normal text-gray-400">(valfritt men rekommenderat)</span></StepTitle>
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
