import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn() },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (
    sub: string,
    queryParams?: Record<string, string>
): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'GET', path: '/basecamp/trail-waypoints', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'GET /basecamp/trail-waypoints', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /basecamp/trail-waypoints',
    rawPath: '/basecamp/trail-waypoints',
    rawQueryString: '',
    headers: {},
    queryStringParameters: queryParams,
    isBase64Encoded: false,
})

const makeWaypoint = (id: string, userId: string, trailId: string) => ({
    pk: `USER#${userId}`,
    sk: `WAYPOINT#${id}`,
    title: `Waypoint ${id}`,
    url: `https://example.com/${id}`,
    favicon: null,
    read: false,
    readLater: false,
    trailId,
    markers: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    gsi1pk: `TRAIL#${trailId}`,
    gsi1sk: `WAYPOINT#${id}`,
})

describe('basecamp/trail-waypoints handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when trailId is missing', async () => {
        const result = await handler(mockEvent('user-123')) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns paginated waypoints for a trail', async () => {
        const waypoints = [
            makeWaypoint('wp-1', 'user-123', 'trail-abc'),
            makeWaypoint('wp-2', 'user-123', 'trail-abc'),
        ]
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: waypoints }) // GSI query
            .mockResolvedValueOnce({ Items: [] })         // logs query

        const result = await handler(mockEvent('user-123', { trailId: 'trail-abc' })) as any
        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.waypoints).toHaveLength(2)
        expect(data.filteredCount).toBe(2)
    })

    it('filters out waypoints belonging to other users', async () => {
        const waypoints = [
            makeWaypoint('wp-1', 'user-123', 'trail-abc'),
            makeWaypoint('wp-2', 'user-999', 'trail-abc'), // different user
        ]
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: waypoints })
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('user-123', { trailId: 'trail-abc' })) as any
        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.waypoints).toHaveLength(1)
        expect(data.filteredCount).toBe(1)
    })

    it('paginates correctly', async () => {
        const waypoints = Array.from({ length: 10 }, (_, i) =>
            makeWaypoint(`wp-${i}`, 'user-123', 'trail-abc')
        )
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: waypoints })
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('user-123', { trailId: 'trail-abc', page: '2', pageSize: '3' })) as any
        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.waypoints).toHaveLength(3)
        expect(data.filteredCount).toBe(10)
    })

    it('attaches matching logs to waypoints', async () => {
        const waypoints = [makeWaypoint('wp-1', 'user-123', 'trail-abc')]
        const logs = [{
            pk: 'USER#user-123',
            sk: 'LOG#log-1',
            content: 'Test log',
            waypointId: 'wp-1',
            createdAt: '2026-01-02T00:00:00.000Z',
        }]
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: waypoints })
            .mockResolvedValueOnce({ Items: logs })

        const result = await handler(mockEvent('user-123', { trailId: 'trail-abc' })) as any
        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.waypoints[0].logs).toHaveLength(1)
        expect(data.waypoints[0].logs[0].content).toBe('Test log')
    })

    it('filters waypoints by search query', async () => {
        const waypoints = [
            { ...makeWaypoint('wp-1', 'user-123', 'trail-abc'), title: 'Match Me' },
            { ...makeWaypoint('wp-2', 'user-123', 'trail-abc'), title: 'Other' },
        ]
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: waypoints })
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('user-123', { trailId: 'trail-abc', search: 'Match' })) as any
        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.waypoints).toHaveLength(1)
        expect(data.waypoints[0].title).toBe('Match Me')
        expect(data.filteredCount).toBe(1)
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('user-123', { trailId: 'trail-abc' })) as any
        expect(result.statusCode).toBe(500)
    })
})
