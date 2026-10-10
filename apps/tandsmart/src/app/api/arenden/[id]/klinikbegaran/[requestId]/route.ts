import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Patient revokes their consent; the clinic link stops working at once.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; requestId: string }> }) {
  const { id, requestId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ej inloggad.' }, { status: 401 })

  const { data: r } = await supabase.from('clinic_requests').select('id, created_by').eq('id', requestId).eq('case_id', id).maybeSingle()
  if (!r || r.created_by !== user.id) return NextResponse.json({ error: 'Begäran hittades inte.' }, { status: 404 })

  const { error } = await createAdminClient().from('clinic_requests').update({ status: 'aterkallad' }).eq('id', requestId)
  if (error) return NextResponse.json({ error: 'Kunde inte återkalla.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
