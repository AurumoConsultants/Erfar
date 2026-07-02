import { z } from 'zod'

export const lessonSchema = z.object({
  type: z.enum(['challenge', 'success']),
  title: z.string().min(1, 'Rubrik krävs'),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

export type LessonFormValues = z.infer<typeof lessonSchema>
