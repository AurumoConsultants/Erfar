'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Field, { fieldInputClassName } from '@/components/ui/Field'
import { buttonClassName } from '@/components/ui/Button'
import QuoteItemsEditor, { emptyItem, toQuoteItems, type EditableItem } from '@/components/QuoteItemsEditor'
import PriceAnalysisView from '@/components/PriceAnalysisView'
import { analyzeQuote, type ReferencePrice } from '@/lib/pricing'
import CtaBand from '@/components/ui/CtaBand'
import CardTitle from '@/components/ui/CardTitle'

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
        <CardTitle icon="clipboard">Åtgärder i prisförslaget</CardTitle>
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
        <CardTitle icon="chart" className="mb-4">Resultat</CardTitle>
        <PriceAnalysisView analysis={analysis} />
      </Card>

      <CtaBand actions={<Link href="/arenden/nytt" className={buttonClassName('primary', 'bg-accent-500! hover:bg-accent-400!')}>Skapa ett ärende</Link>}>
        Låt Dr Sylvia gå igenom och hjälpa dig med din vårdplan samt kontrollera din klinik.
      </CtaBand>
    </div>
  )
}
