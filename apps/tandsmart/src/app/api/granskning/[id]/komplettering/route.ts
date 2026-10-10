import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dentistOrError } from '@/lib/apiAuth'
import { sendNotification } from '@/lib/email'

// The dentist asks the patient for more material. The request text is also
// posted as a case message so the dialogue shows what was asked and when.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const dentist = await dentistOrError()
  if (dentist instanceof NextResponse) return dentist

  const { id } = await params
  const { message } = await req.json().catch(() => ({ message: '' }))
  const text = typeof message === 'string' ? message.trim() : ''
  if (!text) return NextResponse.json({ error: 'Skriv vad patienten behöver komplettera med.' }, { status: 400 })
  if (text.length > 5000) return NextResponse.json({ error: 'Texten är för lång.' }, { status: 400 })

  const supabase = await createClient()
  const { data: c } = await supabase.from('cases').select('id, patient_id, status').eq('id', id).maybeSingle()
  if (!c) return NextResponse.json({ error: 'Ärendet hittades inte.' }, { status: 404 })
  if (c.status === 'besvarat' || c.status === 'avslutat') {
    return NextResponse.json({ error: 'Ärendet är redan besvarat.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('cases')
    .update({ status: 'komplettering', info_request: text, info_requested_at: new Date().toISOString(), info_answered_at: null })
    .eq('id', id)
  if (error) return NextResponse.json({ error: 'Kunde inte spara begäran.' }, { status: 500 })

  await supabase.from('case_messages').insert({ case_id: id, author_id: dentist.id, body: `Begäran om komplettering:\n${text}` })

  const { data: patient } = await supabase.from('profiles').select('email').eq('id', c.patient_id).maybeSingle()
  const mail = await sendNotification(
    patient?.email,
    'Tandläkaren behöver mer underlag i ditt ärende',
    'Sylvia behöver kompletterande underlag, till exempel röntgenbilder eller journaluppgifter, för att kunna bedöma ditt ärende. Logga in för att se vad som behövs och ladda upp det.',
    `/arenden/${id}`,
  )
  return NextResponse.json({ ok: true, emailed: mail.sent })
}
