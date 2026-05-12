import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (
    sub: string,
    id: string | undefined,
    body: object
): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: {
                claims: { sub, email: 'test@cairn.local' },
                scopes: [],
            },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '',
        apiId: '',
        domainName: '',
        domainPrefix: '',
        http: {
            method: 'PUT',
            path: `/waypoints/${id}`,
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'PUT /waypoints/{id}',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'PUT /waypoints/{id}',
    rawPath: `/waypoints/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

const validBody = {
    url: 'https://example.com',
    title: 'Example',
    markerIds: [],
}

describe('waypoints/update handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent('user-123', undefined, validBody)) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing waypoint id')
    })

    it('returns 400 when title is missing', async () => {
        const result = await handler(mockEvent('user-123', 'wp-abc', { url: 'https://example.com', markerIds: [] })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('title and url are required')
    })

    it('returns 400 when url is missing', async () => {
        const result = await handler(mockEvent('user-123', 'wp-abc', { title: 'Example', markerIds: [] })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('title and url are required')
    })

    it('returns 200 with the updated waypoint', async () => {
        const updated = {
            pk: 'USER#user-123',
            sk: 'WAYPOINT#wp-abc',
            url: 'https://example.com',
            title: 'Example',
            read: false,
            readLater: false,
            markers: [],
            createdAt: '2026-01-01T00:00:00.000Z',
        }
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: updated })

        const result = await handler(mockEvent('user-123', 'wp-abc', validBody)) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual(updated)
    })

    it('updates the correct DynamoDB key', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: {} })

        await handler(mockEvent('user-123', 'wp-abc', validBody))

        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    Key: { pk: 'USER#user-123', sk: 'WAYPOINT#wp-abc' },
                }),
            })
        )
    })

    it('sets gsi1 fields when trailId is provided', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: {} })

        await handler(mockEvent('user-123', 'wp-abc', { ...validBody, trailId: 'trail-xyz' }))

        const call = vi.mocked(dynamo.send).mock.calls.find(c =>
            c[0].input.UpdateExpression?.includes('gsi1pk')
        )
        expect(call).toBeDefined()
        expect(call![0].input.ExpressionAttributeValues[':gsi1pk']).toBe('TRAIL#trail-xyz')
    })

    it('removes gsi1 fields and trailId when trailId is null', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: {} })

        await handler(mockEvent('user-123', 'wp-abc', { ...validBody, trailId: null }))

        const call = vi.mocked(dynamo.send).mock.calls.find(c =>
            c[0].input.UpdateExpression?.includes('REMOVE')
        )
        expect(call).toBeDefined()
        expect(call![0].input.UpdateExpression).toContain('gsi1pk')
        expect(call![0].input.UpdateExpression).toContain('gsi1sk')
        expect(call![0].input.UpdateExpression).toContain('trailId')
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('user-123', 'wp-abc', validBody)) as any
        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
