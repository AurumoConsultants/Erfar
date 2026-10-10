import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { clinicFolder, findActiveClinicRequest } from '@/lib/clinicRequestServer'
import { reviewerEmail, sendNotification } from '@/lib/email'
import type { CaseFileKind } from '@/lib/cases'

const KINDS = new Set<CaseFileKind>(['prisforslag', 'vardplan', 'rontgen', 'journal', 'foto', 'ovrigt'])

interface UploadedFile { path: string; name: string; mimeType: string; kind: CaseFileKind }

// Records the clinic's uploaded files on the case and notifies patient + dentist.
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const request = await findActiveClinicRequest(token)
  if (!request) return NextResponse.json({ error: 'Länken är ogiltig eller har gått ut.' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const senderName = String(body.senderName ?? '').trim().slice(0, 120)
  const files: UploadedFile[] = Array.isArray(body.files) ? body.files : []
  if (!senderName) return NextResponse.json({ error: 'Ange ditt namn.' }, { status: 400 })
  if (files.length === 0 || files.length > 50) return NextResponse.json({ error: 'Inga filer att spara.' }, { status: 400 })

  const folder = clinicFolder(request)
  const admin = createAdminClient()
  // Only accept files that really landed in this case's folder via a signed URL.
  const { data: listed } = await admin.storage.from('case-files').list(folder, { limit: 1000 })
  const existing = new Set((listed ?? []).map(o => `${folder}/${o.name}`))
  const valid = files.filter(f =>
    typeof f.path === 'string' && f.path.startsWith(`${folder}/klinik-`) && existing.has(f.path) && KINDS.has(f.kind))
  if (valid.length !== files.length) return NextResponse.json({ error: 'En eller flera filer kunde inte verifieras. Ladda upp dem igen.' }, { status: 400 })

  const { error } = await admin.from('case_files').upsert(valid.map(f => ({
    case_id: request.case_id, path: f.path, file_name: String(f.name).slice(0, 200),
    mime_type: String(f.mimeType || 'application/octet-stream'), kind: f.kind, source: 'klinik',
  })), { onConflict: 'path', ignoreDuplicates: true })
  if (error) return NextResponse.json({ error: 'Kunde inte spara filerna.' }, { status: 500 })

  await admin.from('clinic_requests').update({
    status: 'uppladdad', uploaded_at: new Date().toISOString(),
    uploaded_files: request.uploaded_files + valid.length, uploaded_by_name: senderName,
  }).eq('id', request.id)

  const { data: patient } = await admin.from('profiles').select('email').eq('id', request.patient_id).maybeSingle()
  await Promise.all([
    sendNotification(patient?.email, `${request.clinic_name} har skickat dina journaluppgifter`,
      `${request.clinic_name} har laddat upp ${valid.length} fil(er) till ditt ärende hos Tandsmart.`, `/arenden/${request.case_id}`),
    sendNotification(reviewerEmail(), 'Journaluppgifter från klinik inkomna',
      `${request.clinic_name} har laddat upp ${valid.length} fil(er) i ett ärende.`, `/granskning/${request.case_id}`),
  ])
  return NextResponse.json({ ok: true, saved: valid.length })
}
