import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reviewerEmail, sendNotification } from '@/lib/email'

// Called by the patient's browser right after creating a case.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ej inloggad.' }, { status: 401 })

  const { data: c } = await supabase.from('cases').select('id, patient_id').eq('id', id).maybeSingle()
  if (!c || c.patient_id !== user.id) return NextResponse.json({ error: 'Ärendet hittades inte.' }, { status: 404 })

  const result = await sendNotification(reviewerEmail(), 'Nytt ärende i Tandsmart', 'Ett nytt ärende väntar på granskning.', `/granskning/${id}`)
  return NextResponse.json(result)
}
