'use client'

import { useMemo } from 'react'

interface MediaUploaderProps {
  files: File[]
  onChange: (files: File[]) => void
  addLabel: string
  gdprNotice: string
}

export default function MediaUploader({ files, onChange, addLabel, gdprNotice }: MediaUploaderProps) {
  const previews = useMemo(
    () => files.map(f => ({ url: URL.createObjectURL(f), isVideo: f.type.startsWith('video/') })),
    [files]
  )

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    onChange([...files, ...selected])
    e.target.value = ''
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div>
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
        ⚠️ {gdprNotice}
      </p>
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex items-center justify-center cursor-pointer text-sm border border-gray-300 rounded-lg px-3 py-2.5 min-h-11 hover:bg-gray-50">
          📷 Ta foto
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleSelect} />
        </label>
        <label className="inline-flex items-center justify-center cursor-pointer text-sm border border-gray-300 rounded-lg px-3 py-2.5 min-h-11 hover:bg-gray-50">
          {addLabel}
          <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleSelect} />
        </label>
      </div>
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {previews.map((p, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-black">
              {p.isVideo ? (
                <video src={p.url} className="w-full h-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.url} alt="" className="w-full h-full object-cover" />
              )}
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
