'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Field, { fieldInputClassName } from '@/components/ui/Field'
import { CLINIC_RATING_LABELS, type ClinicRating } from '@/lib/cases'
import type { ClinicReviewRow } from '@/lib/caseData'

const DIMENSIONS = [
  { key: 'finance', label: 'Ekonomi', hint: 'Resultat, eget kapital, betalningsanmärkningar, konkurs/likvidation, ägarbyten.' },
  { key: 'ivo', label: 'IVO & tillsyn', hint: 'Tillsynsbeslut, lex Maria, registrering i vårdgivarregistret.' },
  { key: 'reputation', label: 'Rykte & omdömen', hint: 'Google, Reco, nyheter. Mönster snarare än enstaka omdömen.' },
] as const

type DimensionKey = typeof DIMENSIONS[number]['key']

interface CompanyLookup { configured?: boolean; company?: Record<string, unknown> | null; error?: string }

export default function ClinicReviewForm({ orgNumber, defaultName, initial }: {
  orgNumber: string
  defaultName: string
  initial: ClinicReviewRow | null
}) {
  const router = useRouter()
  const [name, setName] = useState(initial?.name ?? defaultName)
  const [ratings, setRatings] = useState<Record<DimensionKey, ClinicRating>>({
    finance: initial?.finance_rating ?? 'okand',
    ivo: initial?.ivo_rating ?? 'okand',
    reputation: initial?.reputation_rating ?? 'okand',
  })
  const [notes, setNotes] = useState<Record<DimensionKey, string>>({
    finance: initial?.finance_note ?? '',
    ivo: initial?.ivo_note ?? '',
    reputation: initial?.reputation_note ?? '',
  })
  const [lookup, setLookup] = useState<CompanyLookup | null>(null)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function fetchCompany() {
    const res = await fetch(`/api/klinik?orgNumber=${orgNumber}`)
    setLookup(await res.json().catch(() => ({ error: 'Sökningen misslyckades.' })))
  }

  async function save() {
    setSaving(true)
    setStatus(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('clinic_reviews').upsert({
      org_number: orgNumber,
      name: name.trim() || orgNumber,
      finance_rating: ratings.finance, finance_note: notes.finance.trim() || null,
      ivo_rating: ratings.ivo, ivo_note: notes.ivo.trim() || null,
      reputation_rating: ratings.reputation, reputation_note: notes.reputation.trim() || null,
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    setSaving(false)
    setStatus(error ? 'Kunde inte spara.' : 'Klinikbedömningen är sparad och återanvänds för alla ärenden hos kliniken.')
    if (!error) router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-48">
          <Field label={`Klinik (${orgNumber})`} htmlFor="clinic-name">
            <input id="clinic-name" value={name} onChange={e => setName(e.target.value)} className={fieldInputClassName()} />
          </Field>
        </div>
        <Button variant="secondary" type="button" onClick={fetchCompany}>Hämta bolagsdata</Button>
      </div>
      {lookup && (
        <div className="text-xs bg-gray-50 rounded-lg p-3 overflow-x-auto">
          {lookup.configured === false && 'Bolagsuppslag är inte konfigurerat (COMPANY_LOOKUP_API_KEY). Använd länkarna ovan.'}
          {lookup.error && lookup.error}
          {lookup.company && <pre className="whitespace-pre-wrap">{JSON.stringify(lookup.company, null, 2)}</pre>}
        </div>
      )}
      {initial && <p className="text-xs text-gray-500">Senast bedömd {new Date(initial.reviewed_at).toLocaleDateString('sv-SE')}.</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DIMENSIONS.map(d => (
          <div key={d.key} className="space-y-2">
            <Field label={d.label} htmlFor={`rating-${d.key}`} hint={d.hint}>
              <select id={`rating-${d.key}`} value={ratings[d.key]}
                onChange={e => setRatings(prev => ({ ...prev, [d.key]: e.target.value as ClinicRating }))}
                className={fieldInputClassName()}>
                {Object.entries(CLINIC_RATING_LABELS).map(([value, r]) => <option key={value} value={value}>{r.label}</option>)}
              </select>
            </Field>
            <textarea rows={3} aria-label={`Anteckning ${d.label}`} value={notes[d.key]}
              onChange={e => setNotes(prev => ({ ...prev, [d.key]: e.target.value }))} className={fieldInputClassName()} />
          </div>
        ))}
      </div>
      {status && <p className="text-sm text-gray-600">{status}</p>}
      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={save} disabled={saving}>{saving ? 'Sparar…' : 'Spara klinikbedömning'}</Button>
      </div>
    </div>
  )
}
