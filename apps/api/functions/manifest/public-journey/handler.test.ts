import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

vi.mock('../../shared/optional-auth', () => ({
    resolveRequesterAccess: vi.fn().mockResolvedValue({ userId: null, isAdmin: false }),
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (username: string | undefined): APIGatewayProxyEventV2 => ({
    requestContext: {
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'GET', path: `/public/manifest/${username}/journey`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'GET /public/manifest/{username}/journey', stage: '$default', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /public/manifest/{username}/journey',
    rawPath: `/public/manifest/${username}/journey`,
    rawQueryString: '',
    headers: {},
    pathParameters: username ? { username } : undefined,
    isBase64Encoded: false,
})

const mockProfile = {
    pk: 'USER#user-123',
    sk: 'PROFILE',
    username: 'levi',
    name: 'Levi Smith',
    email: 'levi@example.com',
    image: null,
    headline: 'Software Engineer',
    summary: null,
    bio: 'I like hiking.',
    location: 'Denver, CO',
    website: null,
    linkedin: null,
    github: null,
}

const mockSettings = { pk: 'USER#user-123', sk: 'SETTINGS', defaultTerminology: 'CAIRN', defaultTheme: 'LIGHT' }

describe('manifest/public-journey handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when username is missing', async () => {
        const result = await handler(mockEvent(undefined)) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('username is required')
    })

    it('returns 404 when user is not found', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('unknown')) as any
        expect(result.statusCode).toBe(404)
        expect(JSON.parse(result.body).error).toBe('User not found')
    })

    it('returns 200 with wayfarer, origins, and companions', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [mockProfile] })  // Scan — profile
            .mockResolvedValueOnce({ Item: mockSettings })    // GetItem — settings
            .mockResolvedValueOnce({ Items: [           // Query — companions
                { pk: 'USER#user-123', sk: 'COMPANION#comp-1', name: 'Luna', species: 'Dog' },
            ] })

        const result = await handler(mockEvent('levi')) as any
        expect(result.statusCode).toBe(200)

        const body = JSON.parse(result.body)
        expect(body.wayfarer.username).toBe('levi')
        expect(body.wayfarer.defaultTerminology).toBe('CAIRN')
        expect(body.wayfarer.defaultTheme).toBe('LIGHT')
        expect(body.origins.bio).toBe('I like hiking.')
        expect(body.companions).toHaveLength(1)
        expect(body.companions[0].id).toBe('comp-1')
        expect(body.companions[0].name).toBe('Luna')
    })

    it('returns empty companions array when user has none', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [mockProfile] })
            .mockResolvedValueOnce({ Item: mockSettings })
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('levi')) as any
        const body = JSON.parse(result.body)
        expect(body.companions).toHaveLength(0)
    })

    it('includes Cache-Control header', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [mockProfile] })
            .mockResolvedValueOnce({ Item: mockSettings })
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('levi')) as any
        expect(result.headers['Cache-Control']).toBe('public, max-age=60, stale-while-revalidate=300')
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('levi')) as any
        expect(result.statusCode).toBe(500)
    })
})
