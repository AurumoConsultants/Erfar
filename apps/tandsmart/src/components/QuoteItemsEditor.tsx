'use client'

import { fieldInputClassName } from '@/components/ui/Field'
import type { ReferencePrice } from '@/lib/pricing'
import { normalizeCode } from '@/lib/pricing'

export interface EditableItem {
  key: string
  code: string
  description: string
  tooth: string
  quantity: string
  unitPrice: string
}

export function emptyItem(): EditableItem {
  return { key: crypto.randomUUID(), code: '', description: '', tooth: '', quantity: '1', unitPrice: '' }
}

export function toQuoteItems(items: EditableItem[]) {
  return items
    .filter(i => i.unitPrice.trim() !== '')
    .map(i => ({
      code: normalizeCode(i.code),
      description: i.description.trim() || null,
      tooth: i.tooth.trim() || null,
      quantity: Math.max(1, parseInt(i.quantity, 10) || 1),
      unitPrice: Math.max(0, parseFloat(i.unitPrice.replace(/\s/g, '').replace(',', '.')) || 0),
    }))
}

interface Props {
  items: EditableItem[]
  onChange: (items: EditableItem[]) => void
  references: ReferencePrice[]
  showTooth?: boolean
}

// Line-item entry for a prisförslag: åtgärdskod, optional tooth, quantity
// and the clinic's unit price. Typing a known code fills in its TLV text.
export default function QuoteItemsEditor({ items, onChange, references, showTooth = true }: Props) {
  const byCode = new Map(references.map(r => [r.code, r]))

  function update(key: string, patch: Partial<EditableItem>) {
    onChange(items.map(item => {
      if (item.key !== key) return item
      const next = { ...item, ...patch }
      if (patch.code !== undefined && !item.description) {
        const ref = byCode.get(normalizeCode(patch.code) ?? '')
        if (ref) next.description = ref.description
      }
      return next
    }))
  }

  return (
    <div className="space-y-3">
      <datalist id="reference-codes">
        {references.map(r => <option key={r.code} value={r.code}>{r.description}</option>)}
      </datalist>
      {items.map((item, index) => (
        <div key={item.key} className="grid grid-cols-12 gap-2 items-start">
          <input aria-label={`Åtgärdskod rad ${index + 1}`} placeholder="Kod" list="reference-codes" value={item.code}
            onChange={e => update(item.key, { code: e.target.value })}
            className={fieldInputClassName('col-span-3 sm:col-span-2')} />
          <input aria-label={`Beskrivning rad ${index + 1}`} placeholder="Beskrivning" value={item.description}
            onChange={e => update(item.key, { description: e.target.value })}
            className={fieldInputClassName(showTooth ? 'col-span-9 sm:col-span-4' : 'col-span-9 sm:col-span-6')} />
          {showTooth && (
            <input aria-label={`Tand rad ${index + 1}`} placeholder="Tand" value={item.tooth}
              onChange={e => update(item.key, { tooth: e.target.value })}
              className={fieldInputClassName('col-span-3 sm:col-span-2')} />
          )}
          <input aria-label={`Antal rad ${index + 1}`} placeholder="Antal" inputMode="numeric" value={item.quantity}
            onChange={e => update(item.key, { quantity: e.target.value })}
            className={fieldInputClassName('col-span-3 sm:col-span-1')} />
          <input aria-label={`Pris per st rad ${index + 1}`} placeholder="Pris/st (kr)" inputMode="decimal" value={item.unitPrice}
            onChange={e => update(item.key, { unitPrice: e.target.value })}
            className={fieldInputClassName(showTooth ? 'col-span-4 sm:col-span-2' : 'col-span-4 sm:col-span-2')} />
          <button type="button" aria-label={`Ta bort rad ${index + 1}`}
            onClick={() => onChange(items.length > 1 ? items.filter(i => i.key !== item.key) : [emptyItem()])}
            className="col-span-2 sm:col-span-1 min-h-11 text-gray-400 hover:text-red-600">✕</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, emptyItem()])}
        className="text-sm font-medium text-accent-700 hover:underline">+ Lägg till rad</button>
    </div>
  )
}
