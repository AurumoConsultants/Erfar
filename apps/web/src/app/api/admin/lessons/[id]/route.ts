import { NextResponse } from 'next/server'
import { getAdminProfile } from '@/lib/admin/guard'
import { createAdminClient } from '@/lib/supabase/admin'

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
