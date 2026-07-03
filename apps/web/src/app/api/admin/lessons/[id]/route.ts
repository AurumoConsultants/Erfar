import { NextResponse } from 'next/server'
import { getAdminProfile } from '@/lib/admin/guard'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await getAdminProfile()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const updates: Record<string, unknown> = {}
  if (typeof body.title === 'string') updates.title = body.title
  if ('description' in body) updates.description = body.description || null
  if (typeof body.type === 'string') updates.type = body.type
  if (typeof body.construction_phase === 'string') updates.construction_phase = body.construction_phase
  if ('contact_phone' in body) updates.contact_phone = body.contact_phone || null
  if ('contact_email' in body) updates.contact_email = body.contact_email || null
  if (typeof body.project_id === 'string') updates.project_id = body.project_id

  const supabase = createAdminClient()
  const { error } = await supabase.from('lessons').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await getAdminProfile()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const supabase = createAdminClient()
  // Cascades to lesson_tags/lesson_images via FK on delete cascade.
  // Note: this does not remove the underlying files from the lesson-images
  // storage bucket — same limitation as the existing per-project delete flow.
  const { error } = await supabase.from('lessons').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
