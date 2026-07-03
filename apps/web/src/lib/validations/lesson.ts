import { z } from 'zod'

export const lessonSchema = z.object({
  type: z.enum(['challenge', 'success']),
  construction_phase: z.enum(['idea_stage', 'early_stages', 'design', 'execution', 'management']),
  title: z.string().min(1, 'Rubrik krävs'),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  work_type: z.string().optional(),
  building_part: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Ogiltig e-postadress').optional().or(z.literal('')),
})

export type LessonFormValues = z.infer<typeof lessonSchema>
