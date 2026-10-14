import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { clinicFolder, findActiveClinicRequest } from '@/lib/clinicRequestServer'
import { MAX_FILE_BYTES } from '@/lib/cases'

const ALLOWED = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/tiff', 'application/dicom', 'application/zip'])

// Signed upload URL so the clinic's browser uploads straight to storage
// (Vercel functions can't take 20 MB request bodies).
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const request = await findActiveClinicRequest(token)
  if (!request) return NextResponse.json({ error: 'Länken är ogiltig eller har gått ut.' }, { status: 404 })

  const { fileName, mimeType, size } = await req.json().catch(() => ({}))
  if (typeof fileName !== 'string' || !fileName) return NextResponse.json({ error: 'Filnamn saknas.' }, { status: 400 })
  if (typeof size !== 'number' || size <= 0 || size > MAX_FILE_BYTES) return NextResponse.json({ error: `${fileName} är större än 20 MB.` }, { status: 400 })
  const ext = fileName.toLowerCase().split('.').pop() ?? ''
  if (!ALLOWED.has(String(mimeType)) && !['dcm', 'zip', 'pdf', 'jpg', 'jpeg', 'png', 'tif', 'tiff'].includes(ext)) return NextResponse.json({ error: `${fileName}: filtypen stöds inte. Använd PDF, bild, DICOM eller ZIP.` }, { status: 400 })

  const safeName = fileName.replace(/[^\w.\-]+/g, '_').slice(-120)
  const path = `${clinicFolder(request)}/klinik-${crypto.randomUUID()}-${safeName}`
  const { data, error } = await createAdminClient().storage.from('case-files').createSignedUploadUrl(path)
  if (error || !data) return NextResponse.json({ error: 'Kunde inte förbereda uppladdningen.' }, { status: 500 })
  return NextResponse.json({ path: data.path, uploadToken: data.token })
}
