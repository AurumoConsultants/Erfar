import { z } from 'zod'

export const projectSchema = z.object({
  name: z.string().min(1, 'Namn krävs'),
  description: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived']).default('active'),
})

export type ProjectFormValues = z.infer<typeof projectSchema>
