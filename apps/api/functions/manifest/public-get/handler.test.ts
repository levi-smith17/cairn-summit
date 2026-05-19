import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (username: string | undefined): APIGatewayProxyEventV2 => ({
    requestContext: {
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'GET', path: `/public/manifest/${username}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'GET /public/manifest/{username}', stage: '$default', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /public/manifest/{username}',
    rawPath: `/public/manifest/${username}`,
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
    summary: 'Building things.',
    bio: null,
    location: 'Denver, CO',
    website: 'https://levismith.us',
    linkedin: 'levi-smith',
    github: 'levi-smith17',
}

const mockSettings = { pk: 'USER#user-123', sk: 'SETTINGS', defaultTerminology: 'CAIRN', defaultTheme: 'DARK' }

const emptyQuery = { Items: [] }

describe('manifest/public-get handler', () => {
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

    it('returns 200 with correct shape on happy path', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [mockProfile] })  // Scan — profile
            .mockResolvedValueOnce({ Item: mockSettings })    // GetItem — settings
            .mockResolvedValueOnce({ Items: [{ pk: 'USER#user-123', sk: 'EXPEDITION#exp-1', role: 'Engineer' }] }) // expeditions
            .mockResolvedValueOnce(emptyQuery)                // training
            .mockResolvedValueOnce(emptyQuery)                // gear
            .mockResolvedValueOnce(emptyQuery)                // landmarks
            .mockResolvedValueOnce(emptyQuery)                // summits
            .mockResolvedValueOnce(emptyQuery)                // pathfinding

        const result = await handler(mockEvent('levi')) as any
        expect(result.statusCode).toBe(200)

        const body = JSON.parse(result.body)
        expect(body.wayfarer.username).toBe('levi')
        expect(body.wayfarer.name).toBe('Levi Smith')
        expect(body.wayfarer.defaultTerminology).toBe('CAIRN')
        expect(body.wayfarer.defaultTheme).toBe('DARK')
        expect(body.origins.headline).toBe('Software Engineer')
        expect(body.expeditions).toHaveLength(1)
        expect(body.expeditions[0].id).toBe('exp-1')
        expect(body.training).toHaveLength(0)
    })

    it('falls back to CAIRN/SYSTEM when settings item is missing', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [mockProfile] })
            .mockResolvedValueOnce({ Item: undefined })
            .mockResolvedValue(emptyQuery)

        const result = await handler(mockEvent('levi')) as any
        const body = JSON.parse(result.body)
        expect(body.wayfarer.defaultTerminology).toBe('CAIRN')
        expect(body.wayfarer.defaultTheme).toBe('SYSTEM')
    })

    it('includes Cache-Control header', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [mockProfile] })
            .mockResolvedValueOnce({ Item: mockSettings })
            .mockResolvedValue(emptyQuery)

        const result = await handler(mockEvent('levi')) as any
        expect(result.headers['Cache-Control']).toBe('public, max-age=60, stale-while-revalidate=300')
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('levi')) as any
        expect(result.statusCode).toBe(500)
    })
})
