'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TagKind } from '@erfar/shared'

interface CategoryPickerProps {
  label: string
  kind: TagKind
  companyId: string
  value: string
  onChange: (value: string) => void
  presets: readonly string[]
  existing: string[]
  addCustomLabel: string
}

// Button-grid picker for the two structured lesson categories (byggmoment /
// byggdel). New options a user types in are persisted immediately as
// public.tags rows (kind='work_type'/'building_part'), so they become
// available to everyone at the company for the next lesson too.
export default function CategoryPicker({
  label, kind, companyId, value, onChange, presets, existing, addCustomLabel,
}: CategoryPickerProps) {
  const supabase = createClient()
  const [options, setOptions] = useState<string[]>(() => Array.from(new Set([...presets, ...existing])))
  const [customInput, setCustomInput] = useState('')
  const [adding, setAdding] = useState(false)

  async function addCustom() {
    const clean = customInput.trim().toLowerCase()
    if (!clean) return
    setAdding(true)
    if (!options.includes(clean)) {
      await supabase.from('tags').upsert(
        { company_id: companyId, kind, name: clean },
        { onConflict: 'company_id,kind,name' }
      )
      setOptions(prev => [...prev, clean])
    }
    onChange(clean)
    setCustomInput('')
    setAdding(false)
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`capitalize px-3 py-2 rounded-lg text-sm font-semibold border transition ${
              value === opt ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <input
          type="text"
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
          placeholder={addCustomLabel}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customInput.trim() || adding}
          className="border border-gray-300 rounded-lg px-3 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition"
        >
          +
        </button>
      </div>
    </div>
  )
}
