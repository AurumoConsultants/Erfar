import type { SupabaseClient } from '@supabase/supabase-js'
import type { CaseFileKind } from '@/lib/cases'

export interface PendingCaseFile {
  key: string
  file: File
  kind: CaseFileKind
}

// Uploads files to {patientId}/{caseId}/ in the private bucket and records
// them in case_files. Returns the names of files that failed.
export async function uploadCaseFiles(
  supabase: SupabaseClient,
  patientId: string,
  caseId: string,
  files: PendingCaseFile[],
): Promise<string[]> {
  const failed: string[] = []
  for (const { file, kind } of files) {
    const safeName = file.name.replace(/[^\w.\-]+/g, '_')
    const path = `${patientId}/${caseId}/${crypto.randomUUID()}-${safeName}`
    const { error: uploadError } = await supabase.storage.from('case-files').upload(path, file, { contentType: file.type })
    if (uploadError) { failed.push(file.name); continue }
    const { error: rowError } = await supabase.from('case_files').insert({
      case_id: caseId, path, file_name: file.name, mime_type: file.type || 'application/octet-stream', kind,
    })
    if (rowError) failed.push(file.name)
  }
  return failed
}
