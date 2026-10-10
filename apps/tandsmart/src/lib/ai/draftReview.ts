import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CaseBundle } from '@/lib/caseData'
import { formatKr } from '@/lib/pricing'
import { SERVICE_LABELS } from '@/lib/cases'
import { AiDraftSchema, type AiDraft } from './draftSchema'

const MODEL = 'claude-opus-5-5'

const SYSTEM_PROMPT = `Du är ett analysstöd åt Sylvia, legitimerad tandläkare, som driver Tandsmart — en oberoende tjänst där patienter får en second opinion på prisförslag, vårdplaner och kliniker från svenska tandvårdskliniker.

Du skriver ett UTKAST som Sylvia granskar, redigerar och står för. Patienten ser aldrig ditt utkast direkt.

Riktlinjer:
- Skriv på svenska, sakligt och begripligt för en patient utan tandvårdsutbildning.
- Utgå från svensk tandvård: TLV:s åtgärdskoder och referenspriser, det statliga tandvårdsstödet (ATB, högkostnadsskydd, tiotandvården för 67+) och vetenskap och beprövad erfarenhet.
- Bedöm om föreslagna åtgärder verkar motiverade utifrån underlaget, om det finns mindre ingripande, mer hållbara eller billigare alternativ, och om behandlingen kan delas upp eller vänta.
- Var tydlig med vad underlaget inte räcker till. Utan röntgen eller klinisk undersökning går det ofta inte att avgöra om en åtgärd behövs — skriv det hellre än att gissa.
- Misstänkliggör inte behandlande tandläkare. Formulera frågor patienten kan ställa i stället för anklagelser.
- Läs av åtgärdskoder, tänder, antal och priser från uppladdade dokument så noggrant som möjligt.`

function caseToPrompt(bundle: CaseBundle): string {
  const { case: c, analysis, patient } = bundle
  const age = patient?.birth_year ? new Date().getFullYear() - patient.birth_year : null
  const lines = analysis.lines.map(l =>
    `- ${l.item.code ?? '(ingen kod)'} ${l.item.description ?? ''} × ${l.item.quantity}: ${formatKr(l.lineTotal)}`
    + (l.referenceUnitPrice != null ? ` (referens ${formatKr(l.referenceUnitPrice * l.item.quantity)})` : ' (referenspris saknas i tabellen)'),
  )
  return [
    `Ärende: ${c.title}`,
    `Patienten vill ha: ${c.services.map(s => SERVICE_LABELS[s]).join(', ')}`,
    age != null ? `Patientens ålder: ca ${age} år` : 'Patientens ålder: okänd',
    `Klinik: ${c.clinic_name ?? 'okänd'}${c.clinic_city ? `, ${c.clinic_city}` : ''}${c.is_specialist ? ' (specialisttandvård)' : ''}`,
    '',
    `Patientens beskrivning:\n${c.patient_description ?? '(ingen)'}`,
    '',
    `Patientens frågor:\n${c.patient_questions ?? '(inga)'}`,
    '',
    lines.length
      ? `Åtgärder som patienten skrivit in:\n${lines.join('\n')}\n\nTotalt ${formatKr(analysis.total)}, varav ${formatKr(analysis.aboveReferenceTotal)} över referenspris. Uppskattat tandvårdsstöd ${formatKr(analysis.estimatedSubsidy)}, patientens kostnad ca ${formatKr(analysis.estimatedPatientCost)}.`
      : 'Patienten har inte skrivit in några åtgärder — läs av dem ur dokumenten.',
    '',
    bundle.files.length
      ? `Bifogade dokument: ${bundle.files.map(f => `${f.file_name} (${f.kind})`).join(', ')}`
      : 'Inga dokument bifogade.',
  ].join('\n')
}

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

async function fileBlocks(bundle: CaseBundle): Promise<Anthropic.Beta.BetaContentBlockParam[]> {
  const admin = createAdminClient()
  const blocks: Anthropic.Beta.BetaContentBlockParam[] = []
  for (const file of bundle.files) {
    const isPdf = file.mime_type === 'application/pdf'
    if (!isPdf && !IMAGE_TYPES.has(file.mime_type)) continue
    const { data } = await admin.storage.from('case-files').download(file.path)
    if (!data) continue
    const base64 = Buffer.from(await data.arrayBuffer()).toString('base64')
    blocks.push({ type: 'text', text: `Dokument: ${file.file_name} (${file.kind})` })
    blocks.push(isPdf
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
      : { type: 'image', source: { type: 'base64', media_type: file.mime_type as 'image/jpeg', data: base64 } })
  }
  return blocks
}

export class AiDraftError extends Error {}

export async function draftReview(bundle: CaseBundle): Promise<AiDraft> {
  const client = new Anthropic()
  const content: Anthropic.Beta.BetaContentBlockParam[] = [
    ...(await fileBlocks(bundle)),
    { type: 'text', text: caseToPrompt(bundle) },
  ]

  try {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'high', format: betaZodOutputFormat(AiDraftSchema) },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    })

    if (response.stop_reason === 'refusal') {
      throw new AiDraftError('AI-analysen avböjdes för det här underlaget. Granska ärendet manuellt.')
    }
    if (response.stop_reason === 'max_tokens' || !response.parsed_output) {
      throw new AiDraftError('AI-analysen blev ofullständig. Försök igen.')
    }
    return response.parsed_output
  } catch (error) {
    if (error instanceof AiDraftError) throw error
    if (error instanceof Anthropic.RateLimitError) throw new AiDraftError('AI-tjänsten är tillfälligt överbelastad. Försök igen om en stund.')
    if (error instanceof Anthropic.BadRequestError) throw new AiDraftError(`AI-tjänsten kunde inte läsa underlaget: ${error.message}`)
    if (error instanceof Anthropic.APIError) throw new AiDraftError(`AI-tjänsten svarade med fel ${error.status}.`)
    throw error
  }
}
