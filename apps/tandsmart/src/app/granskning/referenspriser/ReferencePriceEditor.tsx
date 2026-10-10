'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { fieldInputClassName } from '@/components/ui/Field'
import CardTitle from '@/components/ui/CardTitle'

interface Row {
  code: string
  description: string
  price_general: number | null
  price_specialist: number | null
  valid_year: number
  patient_note: string | null
}

const toNumber = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')))

export default function ReferencePriceEditor({ initial }: { initial: Row[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState('')
  const [draft, setDraft] = useState({ code: '', description: '', general: '', specialist: '', note: '' })
  const [status, setStatus] = useState<string | null>(null)

  const shown = initial.filter(r => !filter || r.code.startsWith(filter) || r.description.toLowerCase().includes(filter.toLowerCase()))

  async function upsert(row: Row) {
    const supabase = createClient()
    const { error } = await supabase.from('reference_prices').upsert({ ...row, updated_at: new Date().toISOString() })
    setStatus(error ? `Kunde inte spara ${row.code}.` : `Sparade ${row.code}.`)
    if (!error) router.refresh()
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <CardTitle icon="pencil">Lägg till eller ändra kod</CardTitle>
        <div className="grid grid-cols-12 gap-2">
          <input placeholder="Kod" aria-label="Kod" value={draft.code} onChange={e => setDraft({ ...draft, code: e.target.value.trim() })} className={fieldInputClassName('col-span-3 sm:col-span-2')} />
          <input placeholder="Beskrivning" aria-label="Beskrivning" value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} className={fieldInputClassName('col-span-9 sm:col-span-5')} />
          <input placeholder="Allmän" aria-label="Referenspris allmäntandvård" inputMode="decimal" value={draft.general} onChange={e => setDraft({ ...draft, general: e.target.value })} className={fieldInputClassName('col-span-4 sm:col-span-2')} />
          <input placeholder="Specialist" aria-label="Referenspris specialisttandvård" inputMode="decimal" value={draft.specialist} onChange={e => setDraft({ ...draft, specialist: e.target.value })} className={fieldInputClassName('col-span-4 sm:col-span-2')} />
          <Button className="col-span-4 sm:col-span-1" disabled={!draft.code || !draft.description}
            onClick={() => upsert({
              code: draft.code, description: draft.description.trim(),
              price_general: toNumber(draft.general), price_specialist: toNumber(draft.specialist),
              valid_year: initial.find(r => r.code === draft.code)?.valid_year ?? new Date().getFullYear(),
              patient_note: draft.note.trim() || null,
            }).then(() => setDraft({ code: '', description: '', general: '', specialist: '', note: '' }))}>
            Spara
          </Button>
          <textarea rows={3} placeholder="Din förklaring för patienter (visas på /priser/kod). Valfritt — vad åtgärden innebär, när den behövs, vad man bör fråga om."
            aria-label="Förklaring för patienter" value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })}
            className={fieldInputClassName('col-span-12')} />
        </div>
        {status && <p className="text-sm text-gray-600">{status}</p>}
      </Card>

      <Card>
        <input placeholder="Filtrera på kod eller text…" aria-label="Filtrera" value={filter} onChange={e => setFilter(e.target.value)} className={fieldInputClassName('mb-3')} />
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="py-2 pr-3 font-medium">Kod</th>
              <th className="py-2 pr-3 font-medium">Beskrivning</th>
              <th className="py-2 pr-3 font-medium text-right">Allmän</th>
              <th className="py-2 pr-3 font-medium text-right">Specialist</th>
              <th className="py-2 font-medium text-right">År</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(r => (
              <tr key={r.code} className="border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                onClick={() => setDraft({ code: r.code, description: r.description, general: r.price_general?.toString() ?? '', specialist: r.price_specialist?.toString() ?? '', note: r.patient_note ?? '' })}>
                <td className="py-1.5 pr-3 font-mono">{r.code}</td>
                <td className="py-1.5 pr-3">{r.description}{r.patient_note && <span className="ml-2 text-xs text-accent-700" title="Har förklaring">✎</span>}</td>
                <td className="py-1.5 pr-3 text-right">{r.price_general ?? '—'}</td>
                <td className="py-1.5 pr-3 text-right">{r.price_specialist ?? '—'}</td>
                <td className="py-1.5 text-right text-gray-500">{r.valid_year}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
