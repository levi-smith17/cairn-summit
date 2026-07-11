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
import { resolveRequesterAccess } from '../../shared/optional-auth'

const mockEvent = (
    username: string | undefined,
    headers: Record<string, string> = {},
): APIGatewayProxyEventV2 => ({
    requestContext: {
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'GET', path: `/public/manifest/${username}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'GET /public/manifest/{username}', stage: '$default', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /public/manifest/{username}',
    rawPath: `/public/manifest/${username}`,
    rawQueryString: '',
    headers,
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

const mockSettings = {
    pk: 'USER#user-123',
    sk: 'SETTINGS',
    defaultTerminology: 'CAIRN',
    defaultTheme: 'DARK',
    privacy: { manifestVisibility: 'PUBLIC' },
}

const emptyQuery = { Items: [] }

function mockHappyPath(settings = mockSettings) {
    vi.mocked(dynamo.send)
        .mockResolvedValueOnce({ Items: [mockProfile] })  // Scan — profile
        .mockResolvedValueOnce({ Item: settings })        // GetItem — settings
        .mockResolvedValueOnce({ Items: [{ pk: 'USER#user-123', sk: 'EXPEDITION#exp-1', role: 'Engineer' }] })
        .mockResolvedValueOnce(emptyQuery)                // training
        .mockResolvedValueOnce(emptyQuery)                // gear
        .mockResolvedValueOnce(emptyQuery)                // landmarks
        .mockResolvedValueOnce(emptyQuery)                // summits
        .mockResolvedValueOnce(emptyQuery)                // pathfinding
}

describe('manifest/public-get handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(resolveRequesterAccess).mockResolvedValue({ userId: null, isAdmin: false })
    })

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
        mockHappyPath()

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

    it('returns 403 for PRIVATE manifests when anonymous', async () => {
        mockHappyPath({
            ...mockSettings,
            privacy: { manifestVisibility: 'PRIVATE' },
        })

        const result = await handler(mockEvent('levi')) as any
        expect(result.statusCode).toBe(403)
        expect(JSON.parse(result.body).error).toBe('This manifest is private')
    })

    it('allows owner to view PRIVATE manifests', async () => {
        vi.mocked(resolveRequesterAccess).mockResolvedValue({ userId: 'user-123', isAdmin: false })
        mockHappyPath({
            ...mockSettings,
            privacy: { manifestVisibility: 'PRIVATE' },
        })

        const result = await handler(mockEvent('levi')) as any
        expect(result.statusCode).toBe(200)
    })

    it('allows admin to view PRIVATE manifests', async () => {
        vi.mocked(resolveRequesterAccess).mockResolvedValue({ userId: 'admin-1', isAdmin: true })
        mockHappyPath({
            ...mockSettings,
            privacy: { manifestVisibility: 'PRIVATE' },
        })

        const result = await handler(mockEvent('levi')) as any
        expect(result.statusCode).toBe(200)
    })

    it('allows UNLISTED manifests via direct link', async () => {
        mockHappyPath({
            ...mockSettings,
            privacy: { manifestVisibility: 'UNLISTED' },
        })

        const result = await handler(mockEvent('levi')) as any
        expect(result.statusCode).toBe(200)
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
        mockHappyPath()

        const result = await handler(mockEvent('levi')) as any
        expect(result.headers['Cache-Control']).toBe('public, max-age=60, stale-while-revalidate=300')
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('levi')) as any
        expect(result.statusCode).toBe(500)
    })
})
