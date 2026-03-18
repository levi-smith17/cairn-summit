import { describe, it, expect } from 'vitest'
import { sessionFormSchema } from './doordash'

const validSession = {
  date: '2026-03-18',
  gasPrice: '3.459',
  mpg: '32.0',
}

describe('sessionFormSchema — date', () => {
  it('accepts a valid date string', () => {
    expect(sessionFormSchema.safeParse(validSession).success).toBe(true)
  })

  it('rejects an empty date', () => {
    const result = sessionFormSchema.safeParse({ ...validSession, date: '' })
    expect(result.success).toBe(false)
  })
})

describe('sessionFormSchema — gasPrice', () => {
  it('accepts a positive gas price', () => {
    expect(sessionFormSchema.safeParse(validSession).success).toBe(true)
  })

  it('rejects zero', () => {
    const result = sessionFormSchema.safeParse({ ...validSession, gasPrice: '0' })
    expect(result.success).toBe(false)
  })

  it('rejects a negative value', () => {
    const result = sessionFormSchema.safeParse({ ...validSession, gasPrice: '-1' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty string', () => {
    const result = sessionFormSchema.safeParse({ ...validSession, gasPrice: '' })
    expect(result.success).toBe(false)
  })

  it('rejects non-numeric input', () => {
    const result = sessionFormSchema.safeParse({ ...validSession, gasPrice: 'abc' })
    expect(result.success).toBe(false)
  })
})

describe('sessionFormSchema — mpg', () => {
  it('accepts a positive mpg value', () => {
    expect(sessionFormSchema.safeParse(validSession).success).toBe(true)
  })

  it('rejects zero', () => {
    const result = sessionFormSchema.safeParse({ ...validSession, mpg: '0' })
    expect(result.success).toBe(false)
  })

  it('rejects a negative value', () => {
    const result = sessionFormSchema.safeParse({ ...validSession, mpg: '-5' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty string', () => {
    const result = sessionFormSchema.safeParse({ ...validSession, mpg: '' })
    expect(result.success).toBe(false)
  })
})

describe('sessionFormSchema — optional fields', () => {
  it('accepts a session with no odometer or notes', () => {
    expect(sessionFormSchema.safeParse(validSession).success).toBe(true)
  })

  it('accepts odometer values', () => {
    const result = sessionFormSchema.safeParse({
      ...validSession,
      startOdometer: '45000.0',
      endOdometer: '45067.5',
    })
    expect(result.success).toBe(true)
  })

  it('accepts a notes string', () => {
    const result = sessionFormSchema.safeParse({ ...validSession, notes: 'Saturday morning shift' })
    expect(result.success).toBe(true)
  })
})
