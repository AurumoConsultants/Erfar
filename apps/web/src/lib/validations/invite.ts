import { z } from 'zod'

export const inviteSchema = z.object({
  email: z.string().email('Ogiltig e-postadress'),
  role: z.enum(['entrepreneur', 'spectator_project', 'spectator_company']),
})

export type InviteFormValues = z.infer<typeof inviteSchema>
