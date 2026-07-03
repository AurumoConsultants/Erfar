import { NextResponse } from 'next/server'
import { getAdminProfile } from '@/lib/admin/guard'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await getAdminProfile()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const updates: Record<string, unknown> = {}
  if (typeof body.role === 'string') updates.role = body.role
  if (typeof body.is_admin === 'boolean') {
    if (id === caller.id && body.is_admin === false) {
      return NextResponse.json({ error: 'Du kan inte ta bort din egen adminbehörighet.' }, { status: 400 })
    }
    updates.is_admin = body.is_admin
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('profiles').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await getAdminProfile()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  if (id === caller.id) {
    return NextResponse.json({ error: 'Du kan inte ta bort ditt eget konto.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
