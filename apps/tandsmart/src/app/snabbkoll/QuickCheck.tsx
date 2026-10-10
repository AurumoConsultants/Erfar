'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Field, { fieldInputClassName } from '@/components/ui/Field'
import { buttonClassName } from '@/components/ui/Button'
import QuoteItemsEditor, { emptyItem, toQuoteItems, type EditableItem } from '@/components/QuoteItemsEditor'
import PriceAnalysisView from '@/components/PriceAnalysisView'
import { analyzeQuote, type ReferencePrice } from '@/lib/pricing'

export default function QuickCheck({ references, initialCode }: { references: ReferencePrice[]; initialCode?: string }) {
  const [items, setItems] = useState<EditableItem[]>(() => {
    const ref = initialCode ? references.find(r => r.code === initialCode) : undefined
    return [ref ? { ...emptyItem(), code: ref.code, description: ref.description } : emptyItem()]
  })
  const [birthYear, setBirthYear] = useState('')
  const [priorCosts, setPriorCosts] = useState('')
  const [isSpecialist, setIsSpecialist] = useState(false)

  const analysis = useMemo(() => analyzeQuote(toQuoteItems(items), references, {
    isSpecialist,
    birthYear: parseInt(birthYear, 10) || null,
    priorPeriodCosts: parseFloat(priorCosts) || 0,
  }), [items, references, birthYear, priorCosts, isSpecialist])

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <h2 className="font-semibold">Åtgärder i prisförslaget</h2>
        <QuoteItemsEditor items={items} onChange={setItems} references={references} showTooth={false} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <Field label="Ditt födelseår" htmlFor="by">
            <input id="by" inputMode="numeric" placeholder="1965" value={birthYear}
              onChange={e => setBirthYear(e.target.value)} className={fieldInputClassName()} />
          </Field>
          <Field label="Redan betalt i perioden (kr)" htmlFor="prior" hint="Referenspriskostnad senaste 12 mån, om du vet.">
            <input id="prior" inputMode="decimal" placeholder="0" value={priorCosts}
              onChange={e => setPriorCosts(e.target.value)} className={fieldInputClassName()} />
          </Field>
          <label className="flex items-center gap-2 text-sm sm:pt-7">
            <input type="checkbox" checked={isSpecialist} onChange={e => setIsSpecialist(e.target.checked)} />
            Specialisttandvård
          </label>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">Resultat</h2>
        <PriceAnalysisView analysis={analysis} />
      </Card>

      <Card className="bg-accent-50 border-accent-200 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <p className="text-sm text-gray-700">
          Siffrorna säger inte om behandlingen behövs. Vill du att en legitimerad tandläkare går igenom
          vårdplanen och kliniken?
        </p>
        <Link href="/arenden/nytt" className={buttonClassName('primary', 'shrink-0')}>Skapa ett ärende</Link>
      </Card>
    </div>
  )
}
