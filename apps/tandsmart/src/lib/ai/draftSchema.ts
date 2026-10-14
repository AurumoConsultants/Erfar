import * as z from 'zod/v4'

// The shape of the AI pre-analysis stored in cases.ai_draft. Shared by the
// API route that produces it and the dentist UI that renders it.
export const AiDraftSchema = z.object({
  sammanfattning: z.string().describe('2–4 meningar: vad patienten erbjudits och den övergripande bedömningen.'),
  forslag_omdome: z.enum(['rimligt', 'delvis_rimligt', 'ifragasatt']),
  prisbedomning: z.string().describe('Bedömning av priserna mot referenspriser, avvikande rader och vad som driver kostnaden.'),
  vardplan_forslag: z.array(z.object({
    forslag: z.string(),
    motivering: z.string(),
    prioritet: z.enum(['hog', 'medel', 'lag']),
  })).describe('Konkreta förslag på ändringar eller alternativ i vårdplanen.'),
  fragor_till_kliniken: z.array(z.string()).describe('Frågor patienten bör ställa till sin klinik.'),
  osakerheter: z.array(z.string()).describe('Vad som inte går att bedöma utifrån underlaget, t.ex. saknad röntgen.'),
  extraherade_atgarder: z.array(z.object({
    code: z.string().nullable(),
    description: z.string().nullable(),
    tooth: z.string().nullable(),
    quantity: z.number().int(),
    unit_price: z.number(),
  })).describe('Åtgärder avlästa från uppladdade dokument. Tom lista om inga dokument finns.'),
})

export type AiDraft = z.infer<typeof AiDraftSchema>
