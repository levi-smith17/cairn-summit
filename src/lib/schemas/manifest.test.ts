import { describe, it, expect } from 'vitest'
import { settingsSchema } from './manifest'

const validSettings = {
  defaultTerminology: 'CAIRN' as const,
  defaultTheme: 'SYSTEM' as const,
  listed: true,
}

describe('settingsSchema — username', () => {
  it('accepts a valid username', () => {
    expect(settingsSchema.safeParse({ ...validSettings, username: 'levi' }).success).toBe(true)
  })

  it('accepts an empty string (username is optional)', () => {
    expect(settingsSchema.safeParse({ ...validSettings, username: '' }).success).toBe(true)
  })

  it('accepts usernames with hyphens and underscores', () => {
    expect(settingsSchema.safeParse({ ...validSettings, username: 'levi_smith-99' }).success).toBe(true)
  })

  it('rejects usernames shorter than 3 characters', () => {
    const result = settingsSchema.safeParse({ ...validSettings, username: 'ab' })
    expect(result.success).toBe(false)
  })

  it('rejects usernames longer than 30 characters', () => {
    const result = settingsSchema.safeParse({ ...validSettings, username: 'a'.repeat(31) })
    expect(result.success).toBe(false)
  })

  it('rejects uppercase letters', () => {
    const result = settingsSchema.safeParse({ ...validSettings, username: 'Levi' })
    expect(result.success).toBe(false)
  })

  it('rejects spaces', () => {
    const result = settingsSchema.safeParse({ ...validSettings, username: 'levi smith' })
    expect(result.success).toBe(false)
  })

  it('rejects special characters', () => {
    const result = settingsSchema.safeParse({ ...validSettings, username: 'levi@smith' })
    expect(result.success).toBe(false)
  })
})

describe('settingsSchema — customDomain', () => {
  it('accepts a valid domain', () => {
    expect(settingsSchema.safeParse({ ...validSettings, customDomain: 'mysite.com' }).success).toBe(true)
  })

  it('accepts a subdomain', () => {
    expect(settingsSchema.safeParse({ ...validSettings, customDomain: 'me.mysite.com' }).success).toBe(true)
  })

  it('accepts an empty string (domain is optional)', () => {
    expect(settingsSchema.safeParse({ ...validSettings, customDomain: '' }).success).toBe(true)
  })

  it('rejects a domain with no TLD', () => {
    const result = settingsSchema.safeParse({ ...validSettings, customDomain: 'mysite' })
    expect(result.success).toBe(false)
  })

  it('rejects a plain URL with protocol', () => {
    const result = settingsSchema.safeParse({ ...validSettings, customDomain: 'https://mysite.com' })
    expect(result.success).toBe(false)
  })

  it('rejects a domain with a single-character TLD', () => {
    const result = settingsSchema.safeParse({ ...validSettings, customDomain: 'mysite.c' })
    expect(result.success).toBe(false)
  })
})

describe('settingsSchema — enums', () => {
  it('accepts valid defaultTerminology values', () => {
    expect(settingsSchema.safeParse({ ...validSettings, defaultTerminology: 'CAIRN' }).success).toBe(true)
    expect(settingsSchema.safeParse({ ...validSettings, defaultTerminology: 'STANDARD' }).success).toBe(true)
  })

  it('rejects an invalid defaultTerminology', () => {
    const result = settingsSchema.safeParse({ ...validSettings, defaultTerminology: 'OTHER' })
    expect(result.success).toBe(false)
  })

  it('accepts valid defaultTheme values', () => {
    expect(settingsSchema.safeParse({ ...validSettings, defaultTheme: 'LIGHT' }).success).toBe(true)
    expect(settingsSchema.safeParse({ ...validSettings, defaultTheme: 'DARK' }).success).toBe(true)
    expect(settingsSchema.safeParse({ ...validSettings, defaultTheme: 'SYSTEM' }).success).toBe(true)
  })

  it('rejects an invalid defaultTheme', () => {
    const result = settingsSchema.safeParse({ ...validSettings, defaultTheme: 'PINK' })
    expect(result.success).toBe(false)
  })
})
