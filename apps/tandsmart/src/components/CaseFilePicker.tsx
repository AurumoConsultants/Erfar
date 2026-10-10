'use client'

import { fieldInputClassName } from '@/components/ui/Field'
import { ACCEPTED_FILE_TYPES, FILE_KIND_LABELS, MAX_FILE_BYTES, type CaseFileKind } from '@/lib/cases'
import type { PendingCaseFile } from '@/lib/uploadCaseFiles'

interface Props {
  files: PendingCaseFile[]
  onChange: (files: PendingCaseFile[]) => void
  onError: (message: string) => void
  // Kind preselected for a newly picked file; the patient can change it.
  defaultKind: (file: File) => CaseFileKind
  hint: string
}

// File input plus a per-file "what is this" selector, shared by the new-case
// form and the complement form.
export default function CaseFilePicker({ files, onChange, onError, defaultKind, hint }: Props) {
  function addFiles(list: FileList | null) {
    if (!list) return
    const picked = Array.from(list)
    const tooBig = picked.filter(f => f.size > MAX_FILE_BYTES)
    if (tooBig.length) onError(`${tooBig.map(f => f.name).join(', ')} är större än 20 MB.`)
    onChange([
      ...files,
      ...picked.filter(f => f.size <= MAX_FILE_BYTES).map(file => ({ key: crypto.randomUUID(), file, kind: defaultKind(file) })),
    ])
  }

  return (
    <div className="space-y-3">
      <div>
        <input type="file" multiple accept={ACCEPTED_FILE_TYPES} onChange={e => { addFiles(e.target.files); e.target.value = '' }}
          className="block text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent-100 file:text-accent-800 file:font-medium" />
        <p className="text-xs text-gray-400 mt-1">{hint}</p>
      </div>
      {files.map(f => (
        <div key={f.key} className="flex items-center gap-3 text-sm">
          <span className="flex-1 truncate">{f.file.name}</span>
          <select value={f.kind} aria-label={`Typ av dokument för ${f.file.name}`}
            onChange={e => onChange(files.map(p => p.key === f.key ? { ...p, kind: e.target.value as CaseFileKind } : p))}
            className={fieldInputClassName('w-auto')}>
            {Object.entries(FILE_KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button type="button" onClick={() => onChange(files.filter(p => p.key !== f.key))}
            className="text-gray-400 hover:text-red-600" aria-label={`Ta bort ${f.file.name}`}>✕</button>
        </div>
      ))}
    </div>
  )
}
