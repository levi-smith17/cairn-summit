import { z } from 'zod'

export const accountSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-z0-9-_]+$/, 'Username can only contain lowercase letters, numbers, hyphens and underscores')
    .optional()
    .or(z.literal('')),
  defaultTerminology: z.enum(['CAIRN', 'STANDARD']),
  defaultTheme: z.enum(['LIGHT', 'DARK', 'SYSTEM']),
  customDomain: z
    .string()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/, 'Enter a valid domain (e.g. mysite.com)')
    .optional()
    .or(z.literal('')),
})

export type AccountFormValues = z.infer<typeof accountSchema>

export const addCalendarSchema = z.object({
  appleId: z.string().email('Enter a valid Apple ID email'),
  password: z.string().min(1, 'App-specific password is required'),
  calendarName: z.string().min(1, 'Calendar name is required'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
})

export type AddCalendarFormValues = z.infer<typeof addCalendarSchema>

export const addImapAccountSchema = z.object({
  label:        z.string().min(1, 'Account label is required'),
  emailAddress: z.string().email('Enter a valid email address'),
  imapHost:     z.string().min(1, 'IMAP host is required'),
  imapPort:     z.number().int().min(1).max(65535),
  imapSecure:   z.boolean(),
  smtpHost:     z.string().min(1, 'SMTP host is required'),
  smtpPort:     z.number().int().min(1).max(65535),
  smtpSecure:   z.boolean(),
  username:     z.string().min(1, 'Username is required'),
  password:     z.string().min(1, 'Password is required'),
  isDefault:    z.boolean(),
})

export type AddImapAccountFormValues = z.infer<typeof addImapAccountSchema>
