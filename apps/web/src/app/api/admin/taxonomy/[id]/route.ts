import { NextResponse } from 'next/server'
import { getAdminProfile } from '@/lib/admin/guard'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await getAdminProfile()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const updates: Record<string, unknown> = {}
  if (typeof body.label === 'string') {
    const label = body.label.trim()
    if (!label) return NextResponse.json({ error: 'Namn krävs.' }, { status: 400 })
    updates.label = label
  }
  if (typeof body.sort_order === 'number') updates.sort_order = body.sort_order
  if ('parent_id' in body) updates.parent_id = body.parent_id

  const supabase = createAdminClient()
  const { error } = await supabase.from('taxonomy_nodes').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await getAdminProfile()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const supabase = createAdminClient()
  // Cascades to every descendant node via FK on delete cascade. Does not
  // touch public.tags — tags already created from this branch keep their
  // name and stay attached to whatever projects/lessons used them.
  const { error } = await supabase.from('taxonomy_nodes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
