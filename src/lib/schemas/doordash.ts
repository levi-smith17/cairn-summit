import { z } from 'zod'

export const sessionFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  gasPrice: z.string().min(1, 'Gas price is required').refine(v => parseFloat(v) > 0, 'Must be a positive number'),
  mpg: z.string().min(1, 'MPG is required').refine(v => parseFloat(v) > 0, 'Must be a positive number'),
  startOdometer: z.string().optional(),
  endOdometer: z.string().optional(),
  notes: z.string().optional(),
})

export type SessionFormValues = z.infer<typeof sessionFormSchema>
