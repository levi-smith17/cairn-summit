import { describe, expect, it } from 'vitest'
import {
    generateApiToken,
    hashApiToken,
    isApiToken,
    tokenPrefixFromToken,
} from './api-token'

describe('api-token helpers', () => {
    it('generates prefixed tokens', () => {
        const token = generateApiToken()
        expect(isApiToken(token)).toBe(true)
        expect(token.startsWith('csk_')).toBe(true)
    })

    it('hashes deterministically', () => {
        const token = 'csk_test-token'
        expect(hashApiToken(token)).toBe(hashApiToken(token))
    })

    it('builds a display prefix', () => {
        const token = generateApiToken()
        expect(tokenPrefixFromToken(token)).toBe(token.slice(0, 12))
    })
})
