import { NextResponse } from 'next/server'
import { getAdminProfile } from '@/lib/admin/guard'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await getAdminProfile()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const updates: Record<string, unknown> = {}
  if (typeof body.name === 'string') updates.name = body.name
  if ('description' in body) updates.description = body.description || null
  if ('location' in body) updates.location = body.location || null
  if ('start_date' in body) updates.start_date = body.start_date || null
  if ('end_date' in body) updates.end_date = body.end_date || null
  if (typeof body.status === 'string') updates.status = body.status
  if (typeof body.category_type === 'string') updates.category_type = body.category_type
  if (typeof body.category_subtype === 'string') updates.category_subtype = body.category_subtype
  if (typeof body.company_id === 'string') updates.company_id = body.company_id

  const supabase = createAdminClient()
  const { error } = await supabase.from('projects').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await getAdminProfile()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const supabase = createAdminClient()
  // Cascades to project_members, lessons (and lesson_tags/lesson_images) via FK on delete cascade.
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
