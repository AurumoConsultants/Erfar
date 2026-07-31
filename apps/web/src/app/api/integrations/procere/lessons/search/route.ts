import { createAdminClient } from '@/lib/supabase/admin'
import { verifyIntegrationSecret, isEntrepreneurOnProject } from '@/lib/integrations/procereAuth'
import { NextResponse } from 'next/server'

// Surfaces past lessons relevant to a Procere project, by reusing Erfar's
// own public.search_lessons_for_project() RPC (the same tag-based
// matching "Liknande lärdomar" already uses) — no new matching logic to
// maintain in two places. Always called with p_scope = 'national': the
// service-role caller has no auth.uid(), so the RPC's own
// is_own_company/company_name columns come back false/null for every
// row regardless of scope — every result is already anonymized outside
// a real Erfar session, which is the right default for an external
// caller anyway (Procere never learns which other client's project a
// lesson came from, only the lesson content itself).
export async function POST(req: Request) {
  if (!verifyIntegrationSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { org_number, erfar_project_id } = await req.json()
  if (!org_number || !erfar_project_id) {
    return NextResponse.json({ error: 'org_number och erfar_project_id krävs.' }, { status: 400 })
  }

  const admin = createAdminClient()
  if (!(await isEntrepreneurOnProject(admin, erfar_project_id, org_number))) {
    return NextResponse.json(
      { error: 'Kunde inte bekräfta att detta org.nr är entreprenör på det angivna Erfar-projektet.' },
      { status: 403 }
    )
  }

  const { data, error } = await admin.rpc('search_lessons_for_project', {
    p_project_id: erfar_project_id,
    p_scope: 'national',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const lessons = (data ?? []).map(
    (row: {
      lesson_id: string
      type: string
      title: string
      description: string | null
      construction_phase: string
      created_at: string
      relevance: number
      review_notes: string | null
      solution: string | null
      tags: string[] | null
      category_type: string
      category_subtype: string
    }) => ({
      lessonId: row.lesson_id,
      type: row.type,
      title: row.title,
      description: row.description,
      constructionPhase: row.construction_phase,
      createdAt: row.created_at,
      relevance: row.relevance,
      reviewNotes: row.review_notes,
      solution: row.solution,
      tags: row.tags ?? [],
      categoryType: row.category_type,
      categorySubtype: row.category_subtype,
    })
  )

  return NextResponse.json({ lessons })
}
