'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button, { buttonClassName } from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Field, { fieldInputClassName } from '@/components/ui/Field'
import ClinicRequestList from '@/components/ClinicRequestList'
import type { ClinicRequestRow } from '@/lib/caseData'
import CardTitle from '@/components/ui/CardTitle'

const ITEMS = [
  { value: 'journal', label: 'Journalanteckningar' },
  { value: 'rontgen', label: 'Röntgenbilder' },
  { value: 'vardplan', label: 'Vårdplan / kostnadsförslag' },
  { value: 'foto', label: 'Kliniska foton' },
]

interface Props {
  caseId: string
  defaultClinicName: string
  requests: ClinicRequestRow[]
  canRequest: boolean
  // Personnummer from BankID, set only while the patient is signed in with
  // BankID. Without it the patient is sent to BankID instead of the form.
  verifiedPersonnummer: string | null
}

// Lets the patient have their clinic send journal/röntgen straight to the case.
export default function ClinicRequestPanel({ caseId, defaultClinicName, requests, canRequest, verifiedPersonnummer }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [clinicName, setClinicName] = useState(defaultClinicName)
  const [clinicEmail, setClinicEmail] = useState('')
  const [items, setItems] = useState<string[]>(['journal', 'rontgen'])
  const [period, setPeriod] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ emailed: boolean; link: string } | null>(null)
  const [copied, setCopied] = useState<'ok' | 'failed' | null>(null)
  const linkInput = useRef<HTMLInputElement>(null)

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link)
      setCopied('ok')
      setTimeout(() => setCopied(c => (c === 'ok' ? null : c)), 2500)
    } catch {
      // Clipboard blocked (permissions, older browser): select it for manual copy.
      linkInput.current?.select()
      setCopied('failed')
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await fetch(`/api/arenden/${caseId}/klinikbegaran`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinicName, clinicEmail, items, period, consent }),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) return setError(json.error ?? 'Kunde inte skicka begäran.')
    setResult({ emailed: json.emailed, link: json.link })
    setOpen(false)
    setConsent(false)
    router.refresh()
  }

  async function revoke(id: string) {
    if (!confirm('Återkalla samtycket? Länken till kliniken slutar fungera direkt.')) return
    const res = await fetch(`/api/arenden/${caseId}/klinikbegaran/${id}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
  }

  if (!canRequest && requests.length === 0) return null

  return (
    <Card className="space-y-4">
      <div>
        <CardTitle icon="building">Låt kliniken skicka journal och röntgen</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Slipp begära ut journalen själv: ge ditt samtycke så får kliniken en säker länk där de laddar upp underlaget
          direkt till ditt ärende.
        </p>
      </div>

      <ClinicRequestList requests={requests} actions={r => r.status === 'skickad' && (
        <button type="button" onClick={() => revoke(r.id)} className="text-xs text-red-600 hover:underline">Återkalla</button>
      )} />

      {result && (
        <div className="text-sm rounded-lg bg-accent-50 border border-accent-200 p-3 space-y-2">
          {result.emailed
            ? <p>Begäran är skickad till kliniken. Du får ett mejl när de har laddat upp.</p>
            : <p>Begäran är skapad, men mejlet kunde inte skickas automatiskt. Skicka den här länken till kliniken:</p>}
          {!result.emailed && (
            <>
              <div className="flex gap-2">
                <input ref={linkInput} readOnly value={result.link} aria-label="Länk till kliniken"
                  onFocus={e => e.target.select()} className={fieldInputClassName('text-xs bg-white')} />
                <Button type="button" onClick={() => copyLink(result.link)} className="shrink-0 min-w-28">
                  {copied === 'ok' ? '✓ Kopierad' : 'Kopiera'}
                </Button>
              </div>
              <p role="status" className={`text-xs ${copied === 'failed' ? 'text-red-600' : 'text-accent-700'}`}>
                {copied === 'ok' && 'Länken är kopierad — klistra in den i ett mejl till kliniken.'}
                {copied === 'failed' && 'Kunde inte kopiera automatiskt. Länken är markerad — kopiera den med Ctrl+C (⌘+C på Mac).'}
              </p>
            </>
          )}
        </div>
      )}

      {canRequest && !open && !verifiedPersonnummer && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-2 text-sm">
          <p>
            Kliniken lämnar bara ut journal och röntgen när du har legitimerat dig. Logga in med BankID, så ser kliniken
            att det verkligen är du som ger samtycket.
          </p>
          <a href={`/auth/bankid?next=/arenden/${caseId}`} className={buttonClassName('primary', 'bg-brand-navy!')}>
            Legitimera dig med BankID
          </a>
        </div>
      )}

      {canRequest && !open && verifiedPersonnummer && (
        <Button variant="secondary" onClick={() => { setOpen(true); setResult(null); setCopied(null) }}>
          {requests.length ? 'Skicka en ny begäran' : 'Be kliniken skicka underlag'}
        </Button>
      )}

      {open && verifiedPersonnummer && (
        <form onSubmit={send} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Klinikens namn" htmlFor="cr-name">
              <input id="cr-name" required value={clinicName} onChange={e => setClinicName(e.target.value)} className={fieldInputClassName()} />
            </Field>
            <Field label="Klinikens e-post" htmlFor="cr-email" hint="Finns ofta på klinikens webbplats eller kostnadsförslaget.">
              <input id="cr-email" type="email" required value={clinicEmail} onChange={e => setClinicEmail(e.target.value)} className={fieldInputClassName()} />
            </Field>
            <Field label="Ditt personnummer" htmlFor="cr-pnr" hint="Hämtat från BankID. Visas bara för kliniken via länken.">
              <input id="cr-pnr" readOnly value={verifiedPersonnummer}
                className={fieldInputClassName('bg-gray-50 text-gray-700 cursor-not-allowed')} />
            </Field>
            <Field label="Period (valfritt)" htmlFor="cr-period" hint="T.ex. ”2024–2026” eller ”senaste besöket”.">
              <input id="cr-period" value={period} maxLength={100} onChange={e => setPeriod(e.target.value)} className={fieldInputClassName()} />
            </Field>
          </div>
          <fieldset>
            <legend className="text-sm font-medium mb-1">Vad ska kliniken skicka?</legend>
            <div className="flex flex-wrap gap-3 text-sm">
              {ITEMS.map(i => (
                <label key={i.value} className="flex items-center gap-2">
                  <input type="checkbox" checked={items.includes(i.value)}
                    onChange={() => setItems(prev => prev.includes(i.value) ? prev.filter(x => x !== i.value) : [...prev, i.value])} />
                  {i.label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex gap-3 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1" />
            <span>
              Jag samtycker till att {clinicName || 'kliniken'} lämnar ut kopior av de valda uppgifterna till Tandsmart för
              en second opinion av legitimerad tandläkare. Samtycket gäller i 30 dagar och jag kan återkalla det här när som helst.
            </span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={busy}>Avbryt</Button>
            <Button type="submit" disabled={busy || !consent || items.length === 0}>{busy ? 'Skickar…' : 'Skicka begäran till kliniken'}</Button>
          </div>
        </form>
      )}
    </Card>
  )
}
