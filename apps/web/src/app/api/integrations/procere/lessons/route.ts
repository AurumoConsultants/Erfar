import { createAdminClient } from '@/lib/supabase/admin'
import { verifyIntegrationSecret, isEntrepreneurOnProject } from '@/lib/integrations/procereAuth'
import type { LessonType, ConstructionPhase } from '@erfar/shared'
import { NextResponse } from 'next/server'

const LESSON_TYPES: LessonType[] = ['challenge', 'success']
const CONSTRUCTION_PHASES: ConstructionPhase[] = ['idea_stage', 'early_stages', 'design', 'execution', 'management']

// The only machine-to-machine route in this codebase — Procere pushes a
// KMA Avvikelse/Tillbud in here as a lesson. Authenticated by a shared
// secret (both apps are operated by the same founder), not a per-company
// API key. The secret alone only proves the CALLER is Procere, not which
// Procere company is calling — org_number closes that gap by confirming
// the claimed company is genuinely the entrepreneur on record for the
// target project.
export async function POST(req: Request) {
  if (!verifyIntegrationSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { org_number, erfar_project_id, type, construction_phase, title, description, contact_email, contact_phone, submitted_by } =
    await req.json()

  if (!org_number || !erfar_project_id || !title) {
    return NextResponse.json({ error: 'org_number, erfar_project_id och title krävs.' }, { status: 400 })
  }
  if (!LESSON_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Ogiltigt type-värde.' }, { status: 400 })
  }
  if (!CONSTRUCTION_PHASES.includes(construction_phase)) {
    return NextResponse.json({ error: 'Ogiltigt construction_phase-värde.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Confirm org_number is genuinely the entrepreneur on record for this
  // project — without this, the shared secret alone would let a caller
  // push a lesson into any Erfar project by guessing its id.
  if (!(await isEntrepreneurOnProject(admin, erfar_project_id, org_number))) {
    return NextResponse.json(
      { error: 'Kunde inte bekräfta att detta org.nr är entreprenör på det angivna Erfar-projektet.' },
      { status: 403 }
    )
  }

  const { data: lesson, error } = await admin
    .from('lessons')
    .insert({
      project_id: erfar_project_id,
      type,
      construction_phase,
      title,
      description: description || null,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      created_by: null,
      external_source: 'procere',
      external_submitted_by: submitted_by || null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ lessonId: lesson.id })
}
