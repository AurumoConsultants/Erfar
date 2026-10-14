import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dentistOrError } from '@/lib/apiAuth'
import { isGridSlot } from '@/lib/introCalls'

// The dentist opens or closes bookable intro-call times. Booked times are
// never removed here; they are cancelled explicitly.
export async function POST(req: Request) {
  const dentist = await dentistOrError()
  if (dentist instanceof NextResponse) return dentist

  const body = await req.json().catch(() => ({}))
  const action = body.action === 'close' ? 'close' : body.action === 'open' ? 'open' : null
  const times = (Array.isArray(body.startsAt) ? body.startsAt : [])
    .map((t: unknown) => new Date(String(t)))
    .filter((d: Date) => !Number.isNaN(d.getTime()) && isGridSlot(d) && d.getTime() > Date.now())
    .map((d: Date) => d.toISOString())
  if (!action || times.length === 0 || times.length > 200) {
    return NextResponse.json({ error: 'Ogiltiga tider.' }, { status: 400 })
  }

  const admin = createAdminClient()
  if (action === 'open') {
    const { error } = await admin.from('intro_call_slots')
      .upsert(times.map((starts_at: string) => ({ starts_at, created_by: dentist.id })), { onConflict: 'starts_at', ignoreDuplicates: true })
    if (error) return NextResponse.json({ error: 'Kunde inte spara tiderna.' }, { status: 500 })
  } else {
    const { error } = await admin.from('intro_call_slots').delete().in('starts_at', times).is('booked_by', null)
    if (error) return NextResponse.json({ error: 'Kunde inte ta bort tiderna.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
