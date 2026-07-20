import { NextResponse } from 'next/server'
import { getAdminProfile } from '@/lib/admin/guard'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const caller = await getAdminProfile()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createAdminClient()
  const { data, error } = await supabase.from('taxonomy_nodes').select('*').order('sort_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ nodes: data })
}

export async function POST(req: Request) {
  const caller = await getAdminProfile()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const label = typeof body.label === 'string' ? body.label.trim() : ''
  if (!label) return NextResponse.json({ error: 'Namn krävs.' }, { status: 400 })
  const parentId: string | null = body.parent_id ?? null

  const supabase = createAdminClient()

  // New siblings go last — one after the current highest sort_order under
  // the same parent (or 0 if this is the first child/root).
  let highestQuery = supabase.from('taxonomy_nodes').select('sort_order').order('sort_order', { ascending: false }).limit(1)
  highestQuery = parentId === null ? highestQuery.is('parent_id', null) : highestQuery.eq('parent_id', parentId)
  const { data: highest } = await highestQuery
  const nextSortOrder = (highest?.[0]?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('taxonomy_nodes')
    .insert({ parent_id: parentId, label, sort_order: nextSortOrder })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ node: data })
}
