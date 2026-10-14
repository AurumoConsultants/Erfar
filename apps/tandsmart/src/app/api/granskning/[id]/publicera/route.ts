import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dentistOrError } from '@/lib/apiAuth'
import { sendNotification } from '@/lib/email'

// Publishes the dentist's saved review to the patient and emails them.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const dentist = await dentistOrError()
  if (dentist instanceof NextResponse) return dentist

  const { id } = await params
  const supabase = await createClient()
  const { data: c } = await supabase.from('cases').select('id, patient_id, review_summary, review_verdict').eq('id', id).maybeSingle()
  if (!c) return NextResponse.json({ error: 'Ärendet hittades inte.' }, { status: 404 })
  if (!c.review_summary || !c.review_verdict) {
    return NextResponse.json({ error: 'Fyll i omdöme och sammanfattning innan du publicerar.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('cases')
    .update({ status: 'besvarat', answered_at: new Date().toISOString(), reviewed_by: dentist.id })
    .eq('id', id)
  if (error) return NextResponse.json({ error: 'Kunde inte publicera.' }, { status: 500 })

  const { data: patient } = await supabase.from('profiles').select('email').eq('id', c.patient_id).maybeSingle()
  const mail = await sendNotification(patient?.email, 'Din bedömning från Tandsmart är klar', 'Doktor Sylvia har granskat ditt ärende. Logga in för att läsa bedömningen.', `/arenden/${id}`)
  return NextResponse.json({ ok: true, emailed: mail.sent })
}
