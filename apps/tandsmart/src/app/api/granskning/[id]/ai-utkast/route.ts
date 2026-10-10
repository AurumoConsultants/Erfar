import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dentistOrError } from '@/lib/apiAuth'
import { loadCase } from '@/lib/caseData'
import { AiDraftError, draftReview } from '@/lib/ai/draftReview'

// Opus reading several PDFs/photos can take a while.
export const maxDuration = 300

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const dentist = await dentistOrError()
  if (dentist instanceof NextResponse) return dentist
  if (process.env.TANDSMART_AI_ENABLED !== 'true') {
    return NextResponse.json({ error: 'AI-stödet är inte aktiverat (TANDSMART_AI_ENABLED).' }, { status: 400 })
  }

  const { id } = await params
  const bundle = await loadCase(id, dentist.id)
  if (!bundle) return NextResponse.json({ error: 'Ärendet hittades inte.' }, { status: 404 })

  try {
    const draft = await draftReview(bundle)
    const supabase = await createClient()
    const { error } = await supabase
      .from('cases')
      .update({
        ai_draft: draft,
        ai_draft_at: new Date().toISOString(),
        ...(bundle.case.status === 'inskickat' ? { status: 'under_granskning' } : {}),
      })
      .eq('id', id)
    if (error) return NextResponse.json({ error: 'Utkastet kunde inte sparas.' }, { status: 500 })
    return NextResponse.json({ draft })
  } catch (error) {
    if (error instanceof AiDraftError) return NextResponse.json({ error: error.message }, { status: 502 })
    console.error('AI draft failed', error)
    return NextResponse.json({ error: 'AI-analysen misslyckades.' }, { status: 500 })
  }
}
