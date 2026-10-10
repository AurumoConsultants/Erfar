import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reviewerEmail, sendNotification } from '@/lib/email'

// Notifies the other party after a new case message. Patient → dentist,
// dentist → patient.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ej inloggad.' }, { status: 401 })

  const { data: c } = await supabase.from('cases').select('id, patient_id').eq('id', id).maybeSingle()
  if (!c) return NextResponse.json({ error: 'Ärendet hittades inte.' }, { status: 404 })

  if (c.patient_id === user.id) {
    return NextResponse.json(await sendNotification(reviewerEmail(), 'Nytt meddelande i Tandsmart', 'En patient har skrivit ett meddelande i ett ärende.', `/granskning/${id}`))
  }
  const { data: patient } = await supabase.from('profiles').select('email').eq('id', c.patient_id).maybeSingle()
  return NextResponse.json(await sendNotification(patient?.email, 'Nytt meddelande från din tandläkare', 'Du har fått ett nytt meddelande i ditt ärende hos Tandsmart.', `/arenden/${id}`))
}
