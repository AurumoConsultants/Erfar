'use client'

import { useState } from 'react'
import { SUGGESTED_TAGS } from '@erfar/shared'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  /** When false, only tags already present in `suggestions` (+ the global
   * SUGGESTED_TAGS library) can be added — no free-text tag creation.
   * Defaults to true (lesson-tagging behavior). */
  allowCreate?: boolean
}

export default function TagInput({ value, onChange, suggestions = [], allowCreate = true }: TagInputProps) {
  const [input, setInput] = useState('')

  const library = Array.from(new Set([...suggestions, ...SUGGESTED_TAGS]))
  const allSuggestions = library
    .filter(s => !value.includes(s))
    .filter(s => input === '' || s.toLowerCase().includes(input.toLowerCase()))
    .slice(0, allowCreate ? 6 : 20)

  function addTag(tag: string) {
    const clean = tag.trim().toLowerCase()
    if (!clean || value.includes(clean)) { setInput(''); return }
    if (!allowCreate && !library.some(l => l.toLowerCase() === clean)) return // not in the library — ignore
    onChange([...value, clean])
    setInput('')
  }

  function removeTag(tag: string) {
    onChange(value.filter(t => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-sm px-2 py-1 rounded-full">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="text-blue-400 hover:text-blue-700">×</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={allowCreate ? 'Skriv en tagg och tryck Enter...' : 'Sök i taggbiblioteket...'}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {allSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {allSuggestions.map(s => (
            <button key={s} type="button" onClick={() => addTag(s)}
              className="text-xs border border-gray-200 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-50">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
