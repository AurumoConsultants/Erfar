'use client'

import { useState } from 'react'

interface PhotoUploaderProps {
  files: File[]
  onChange: (files: File[]) => void
}

export default function PhotoUploader({ files, onChange }: PhotoUploaderProps) {
  const [previews, setPreviews] = useState<string[]>([])

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    const next = [...files, ...selected]
    onChange(next)
    setPreviews(next.map(f => URL.createObjectURL(f)))
    e.target.value = ''
  }

  function removeAt(index: number) {
    const next = files.filter((_, i) => i !== index)
    onChange(next)
    setPreviews(next.map(f => URL.createObjectURL(f)))
  }

  return (
    <div>
      <label className="inline-block cursor-pointer text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50">
        Lägg till foto
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleSelect} />
      </label>
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {previews.map((src, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeAt(i)}
                className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-5 h-5 text-xs leading-none flex items-center justify-center">
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
