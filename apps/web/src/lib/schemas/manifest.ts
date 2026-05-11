import { z } from 'zod'

export const settingsSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-z0-9-_]+$/, 'Username can only contain lowercase letters, numbers, hyphens and underscores')
    .optional()
    .or(z.literal('')),
  defaultTerminology: z.enum(['CAIRN', 'STANDARD']),
  defaultTheme: z.enum(['LIGHT', 'DARK', 'SYSTEM']),
  listed: z.boolean(),
  customDomain: z
    .string()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/, 'Enter a valid domain (e.g. mysite.com)')
    .optional()
    .or(z.literal('')),
})

export type SettingsFormValues = z.infer<typeof settingsSchema>
