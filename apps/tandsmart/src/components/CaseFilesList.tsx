import { FILE_KIND_LABELS } from '@/lib/cases'
import type { CaseFileRow } from '@/lib/caseData'

export default function CaseFilesList({ files }: { files: CaseFileRow[] }) {
  if (files.length === 0) return <p className="text-sm text-gray-500">Inga uppladdade dokument.</p>
  return (
    <ul className="space-y-2 text-sm">
      {files.map(f => (
        <li key={f.id} className="flex items-center justify-between gap-3">
          {f.signedUrl
            ? <a href={f.signedUrl} target="_blank" rel="noreferrer" className="text-accent-700 hover:underline truncate">{f.file_name}</a>
            : <span className="truncate">{f.file_name}</span>}
          <span className="text-xs text-gray-500 shrink-0">
            {f.source === 'klinik' && <span className="mr-2 px-1.5 py-0.5 rounded bg-green-100 text-green-700">från kliniken</span>}
            {FILE_KIND_LABELS[f.kind]}
          </span>
        </li>
      ))}
    </ul>
  )
}
