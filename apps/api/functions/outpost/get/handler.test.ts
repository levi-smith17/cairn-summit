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

const mockEvent = (queryStringParameters?: Record<string, string>): APIGatewayProxyEventV2 => ({
    requestContext: {
        accountId: '',
        apiId: '',
        domainName: '',
        domainPrefix: '',
        http: {
            method: 'GET',
            path: '/outpost',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'GET /outpost',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /outpost',
    rawPath: '/outpost',
    rawQueryString: '',
    headers: {},
    isBase64Encoded: false,
    queryStringParameters,
})

describe('outpost/get handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(resolveRequesterAccess).mockResolvedValue({ userId: null, isAdmin: false })
    })

    it('returns empty wayfarers when no profiles exist', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent()) as any
        const body = JSON.parse(result.body)
        expect(result.statusCode).toBe(200)
        expect(body.data.wayfarers).toEqual([])
        expect(body.data.nextCursor).toBeNull()
    })

    it('returns mapped wayfarers with expedition count and top gear', async () => {
        const profile = {
            pk: 'USER#user-123',
            sk: 'PROFILE',
            name: 'Jane Hiker',
            email: 'jane@example.com',
            image: null,
            username: 'janehiker',
            location: 'Denver, CO',
            listed: true,
            createdAt: '2026-01-01T00:00:00.000Z',
        }
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [profile] })
            .mockResolvedValueOnce({ Item: { privacy: { manifestVisibility: 'PUBLIC' } } })
            .mockResolvedValueOnce({ Count: 3 })
            .mockResolvedValueOnce({ Items: [{ name: 'TypeScript' }, { name: 'AWS' }] })

        const result = await handler(mockEvent()) as any
        const { wayfarers } = JSON.parse(result.body).data
        expect(result.statusCode).toBe(200)
        expect(wayfarers).toHaveLength(1)
        expect(wayfarers[0]).toMatchObject({
            id: 'user-123',
            name: 'Jane Hiker',
            username: 'janehiker',
            location: 'Denver, CO',
            expeditionCount: 3,
            topGear: ['TypeScript', 'AWS'],
            memberSince: '2026-01-01T00:00:00.000Z',
        })
    })

    it('excludes PRIVATE and unlisted profiles for non-admins', async () => {
        const privateProfile = {
            pk: 'USER#priv',
            sk: 'PROFILE',
            listed: true,
            username: 'private',
            createdAt: '2026-01-01T00:00:00.000Z',
        }
        const unlistedProfile = {
            pk: 'USER#unlist',
            sk: 'PROFILE',
            listed: false,
            username: 'hidden',
            createdAt: '2026-01-01T00:00:00.000Z',
        }
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [privateProfile, unlistedProfile] })
            .mockResolvedValueOnce({ Item: { privacy: { manifestVisibility: 'PRIVATE' } } })
            .mockResolvedValueOnce({ Count: 0 })
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Item: { privacy: { manifestVisibility: 'PUBLIC' } } })
            .mockResolvedValueOnce({ Count: 0 })
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent()) as any
        expect(JSON.parse(result.body).data.wayfarers).toHaveLength(0)
    })

    it('excludes UNLISTED from directory for non-admins (link-only)', async () => {
        const profile = {
            pk: 'USER#user-1',
            sk: 'PROFILE',
            listed: true,
            username: 'unlisted-but-listed',
            createdAt: '2026-01-01T00:00:00.000Z',
        }
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [profile] })
            .mockResolvedValueOnce({ Item: { privacy: { manifestVisibility: 'UNLISTED' } } })
            .mockResolvedValueOnce({ Count: 0 })
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent()) as any
        expect(JSON.parse(result.body).data.wayfarers).toHaveLength(0)
    })

    it('admins see PRIVATE and unlisted profiles', async () => {
        vi.mocked(resolveRequesterAccess).mockResolvedValue({ userId: 'admin-1', isAdmin: true })
        const profile = {
            pk: 'USER#priv',
            sk: 'PROFILE',
            listed: false,
            username: 'secret',
            createdAt: '2026-01-01T00:00:00.000Z',
        }
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [profile] })
            .mockResolvedValueOnce({ Item: { privacy: { manifestVisibility: 'PRIVATE' } } })
            .mockResolvedValueOnce({ Count: 0 })
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent()) as any
        expect(JSON.parse(result.body).data.wayfarers).toHaveLength(1)
    })

    it('caps topGear at 5 items', async () => {
        const profile = {
            pk: 'USER#user-123',
            sk: 'PROFILE',
            listed: true,
            createdAt: '2026-01-01T00:00:00.000Z',
        }
        const gear = [1, 2, 3, 4, 5, 6, 7].map(i => ({ name: `Skill${i}` }))
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [profile] })
            .mockResolvedValueOnce({ Item: {} })
            .mockResolvedValueOnce({ Count: 0 })
            .mockResolvedValueOnce({ Items: gear })

        const result = await handler(mockEvent()) as any
        const { wayfarers } = JSON.parse(result.body).data
        expect(wayfarers[0].topGear).toHaveLength(5)
    })

    it('returns nextCursor when LastEvaluatedKey is present', async () => {
        const lastKey = { pk: 'USER#abc', sk: 'PROFILE' }
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [], LastEvaluatedKey: lastKey })

        const result = await handler(mockEvent()) as any
        const { nextCursor } = JSON.parse(result.body).data
        expect(nextCursor).not.toBeNull()
        const decoded = JSON.parse(Buffer.from(nextCursor, 'base64url').toString('utf8'))
        expect(decoded).toEqual(lastKey)
    })

    it('passes cursor as ExclusiveStartKey on subsequent requests', async () => {
        const lastKey = { pk: 'USER#abc', sk: 'PROFILE' }
        const cursor = Buffer.from(JSON.stringify(lastKey)).toString('base64url')
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })

        await handler(mockEvent({ cursor }))

        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    ExclusiveStartKey: lastKey,
                }),
            })
        )
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
