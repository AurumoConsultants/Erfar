'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Field, { fieldInputClassName } from '@/components/ui/Field'
import { VERDICT_LABELS, type CaseStatus, type CaseVerdict } from '@/lib/cases'
import type { AiDraft } from '@/lib/ai/draftSchema'

interface ReviewFields {
  verdict: CaseVerdict | ''
  summary: string
  price: string
  plan: string
  clinic: string
  questions: string
}

interface Props {
  caseId: string
  status: CaseStatus
  hasItems: boolean
  aiEnabled: boolean
  initialDraft: AiDraft | null
  draftAt: string | null
  initialReview: ReviewFields
}

const PRIORITY_LABELS = { hog: 'Hög', medel: 'Medel', lag: 'Låg' } as const

function draftToReview(draft: AiDraft): Partial<ReviewFields> {
  return {
    verdict: draft.forslag_omdome,
    summary: draft.sammanfattning,
    price: draft.prisbedomning,
    plan: draft.vardplan_forslag.map(f => `• ${f.forslag}\n  ${f.motivering}`).join('\n\n'),
    questions: draft.fragor_till_kliniken.map(q => `• ${q}`).join('\n'),
  }
}

export default function ReviewWorkspace({ caseId, status, hasItems, aiEnabled, initialDraft, draftAt, initialReview }: Props) {
  const router = useRouter()
  const [draft, setDraft] = useState(initialDraft)
  const [review, setReview] = useState<ReviewFields>(initialReview)
  const [busy, setBusy] = useState<null | 'ai' | 'save' | 'publish' | 'items'>(null)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const published = status === 'besvarat' || status === 'avslutat'

  function set<K extends keyof ReviewFields>(key: K, value: ReviewFields[K]) {
    setReview(prev => ({ ...prev, [key]: value }))
  }

  async function runAi() {
    setBusy('ai')
    setMessage(null)
    const res = await fetch(`/api/granskning/${caseId}/ai-utkast`, { method: 'POST' })
    const json = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) return setMessage({ tone: 'error', text: json.error ?? 'AI-analysen misslyckades.' })
    setDraft(json.draft)
    router.refresh()
  }

  async function importItems() {
    if (!draft?.extraherade_atgarder.length) return
    setBusy('items')
    const supabase = createClient()
    const { error } = await supabase.from('case_items').insert(
      draft.extraherade_atgarder.map((item, sort) => ({
        case_id: caseId,
        code: item.code?.replace(/\s+/g, '') || null,
        description: item.description,
        tooth: item.tooth,
        quantity: Math.max(1, item.quantity),
        unit_price: Math.max(0, item.unit_price),
        sort,
      })),
    )
    setBusy(null)
    if (error) return setMessage({ tone: 'error', text: 'Kunde inte importera åtgärderna.' })
    router.refresh()
  }

  async function save(): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase.from('cases').update({
      review_verdict: review.verdict || null,
      review_summary: review.summary.trim() || null,
      review_price: review.price.trim() || null,
      review_plan: review.plan.trim() || null,
      review_clinic: review.clinic.trim() || null,
      review_questions: review.questions.trim() || null,
      ...(status === 'inskickat' ? { status: 'under_granskning' } : {}),
    }).eq('id', caseId)
    if (error) {
      setMessage({ tone: 'error', text: 'Kunde inte spara.' })
      return false
    }
    return true
  }

  async function onSave() {
    setBusy('save')
    setMessage(null)
    const ok = await save()
    setBusy(null)
    if (ok) {
      setMessage({ tone: 'ok', text: published ? 'Ändringarna är sparade och syns för patienten.' : 'Utkastet är sparat.' })
      router.refresh()
    }
  }

  async function onPublish() {
    if (!confirm('Publicera bedömningen för patienten? Patienten får ett mejl.')) return
    setBusy('publish')
    setMessage(null)
    if (!(await save())) return setBusy(null)
    const res = await fetch(`/api/granskning/${caseId}/publicera`, { method: 'POST' })
    const json = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) return setMessage({ tone: 'error', text: json.error ?? 'Kunde inte publicera.' })
    setMessage({ tone: 'ok', text: json.emailed ? 'Publicerat — patienten har fått ett mejl.' : 'Publicerat.' })
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="space-y-4 bg-gray-50">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">AI-föranalys <span className="text-xs font-normal text-gray-500">— syns bara för dig</span></h2>
          {aiEnabled && (
            <Button variant="secondary" onClick={runAi} disabled={busy !== null}>
              {busy === 'ai' ? 'Analyserar…' : draft ? 'Kör om' : 'Analysera underlaget'}
            </Button>
          )}
        </div>
        {!aiEnabled && <p className="text-sm text-gray-500">AI-stödet är avstängt. Aktivera med TANDSMART_AI_ENABLED=true.</p>}
        {draft ? (
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2">
              Förslag: <Badge tone={VERDICT_LABELS[draft.forslag_omdome].tone}>{VERDICT_LABELS[draft.forslag_omdome].label}</Badge>
              {draftAt && <span className="text-xs text-gray-400">{new Date(draftAt).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })}</span>}
            </p>
            <p className="whitespace-pre-wrap">{draft.sammanfattning}</p>
            <div>
              <p className="font-medium">Pris</p>
              <p className="whitespace-pre-wrap text-gray-700">{draft.prisbedomning}</p>
            </div>
            {draft.vardplan_forslag.length > 0 && (
              <div>
                <p className="font-medium">Förslag på vårdplanen</p>
                <ul className="space-y-2 mt-1">
                  {draft.vardplan_forslag.map((f, i) => (
                    <li key={i}>
                      <Badge tone={f.prioritet === 'hog' ? 'error' : f.prioritet === 'medel' ? 'warning' : 'neutral'}>{PRIORITY_LABELS[f.prioritet]}</Badge>{' '}
                      {f.forslag}
                      <p className="text-gray-600 text-xs mt-0.5">{f.motivering}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {draft.osakerheter.length > 0 && (
              <div>
                <p className="font-medium">Osäkerheter</p>
                <ul className="list-disc pl-5 text-gray-700">{draft.osakerheter.map((o, i) => <li key={i}>{o}</li>)}</ul>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="secondary" disabled={published} onClick={() => setReview(prev => ({ ...prev, ...draftToReview(draft) }))}>
                Använd som utgångspunkt
              </Button>
              {!hasItems && draft.extraherade_atgarder.length > 0 && (
                <Button variant="secondary" onClick={importItems} disabled={busy !== null}>
                  Importera {draft.extraherade_atgarder.length} avlästa åtgärder
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-400">AI kan läsa fel och missa kliniska detaljer — kontrollera mot underlaget.</p>
          </div>
        ) : aiEnabled && (
          <p className="text-sm text-gray-500">Låt AI läsa av dokumenten och ta fram ett första utkast som du sedan granskar.</p>
        )}
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold">Din bedömning</h2>
        <Field label="Omdöme" htmlFor="verdict">
          <select id="verdict" value={review.verdict} onChange={e => set('verdict', e.target.value as CaseVerdict | '')}
            className={fieldInputClassName()}>
            <option value="">Välj…</option>
            {Object.entries(VERDICT_LABELS).map(([value, v]) => <option key={value} value={value}>{v.label}</option>)}
          </select>
        </Field>
        <Field label="Sammanfattning" htmlFor="summary">
          <textarea id="summary" rows={4} value={review.summary} onChange={e => set('summary', e.target.value)} className={fieldInputClassName()} />
        </Field>
        <Field label="Priset" htmlFor="price">
          <textarea id="price" rows={4} value={review.price} onChange={e => set('price', e.target.value)} className={fieldInputClassName()} />
        </Field>
        <Field label="Vårdplanen — förslag på ändringar" htmlFor="plan">
          <textarea id="plan" rows={6} value={review.plan} onChange={e => set('plan', e.target.value)} className={fieldInputClassName()} />
        </Field>
        <Field label="Kliniken" htmlFor="clinic">
          <textarea id="clinic" rows={3} value={review.clinic} onChange={e => set('clinic', e.target.value)} className={fieldInputClassName()} />
        </Field>
        <Field label="Frågor patienten bör ställa till kliniken" htmlFor="questions">
          <textarea id="questions" rows={4} value={review.questions} onChange={e => set('questions', e.target.value)} className={fieldInputClassName()} />
        </Field>
        {message && <p className={`text-sm ${message.tone === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{message.text}</p>}
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="secondary" onClick={onSave} disabled={busy !== null}>{busy === 'save' ? 'Sparar…' : 'Spara'}</Button>
          {!published && (
            <Button onClick={onPublish} disabled={busy !== null || !review.verdict || !review.summary.trim()}>
              {busy === 'publish' ? 'Publicerar…' : 'Publicera för patienten'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
