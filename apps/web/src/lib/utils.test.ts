import { describe, it, expect } from 'vitest'
import { cn, extractId } from './utils'

describe('cn', () => {
    it('merges class names', () => {
        expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('handles conditional classes', () => {
        expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('deduplicates tailwind classes', () => {
        expect(cn('p-4', 'p-2')).toBe('p-2')
    })

    it('handles undefined and null', () => {
        expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
    })

    it('handles empty input', () => {
        expect(cn()).toBe('')
    })
})

describe('extractId', () => {
    it('extracts id from sk with single hash', () => {
        expect(extractId('MARKER#abc-123')).toBe('abc-123')
    })

    it('extracts id from sk with multiple hashes', () => {
        expect(extractId('USER#123#MARKER#abc')).toBe('abc')
    })

    it('returns original string when no hash present', () => {
        expect(extractId('abc-123')).toBe('abc-123')
    })

    it('handles UUID format', () => {
        expect(extractId('MARKER#550e8400-e29b-41d4-a716-446655440000')).toBe('550e8400-e29b-41d4-a716-446655440000')
    })
})