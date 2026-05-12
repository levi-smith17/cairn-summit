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
            path: `/logs/${id}`,
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'PUT /logs/{id}',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'PUT /logs/{id}',
    rawPath: `/logs/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

const validBody = { content: 'Updated content', markerIds: [] }

describe('logs/update handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent('user-123', undefined, validBody)) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing log id')
    })

    it('returns 400 when content is missing', async () => {
        const result = await handler(mockEvent('user-123', 'log-abc', { markerIds: [] })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('content is required')
    })

    it('returns 200 with the updated log', async () => {
        const updated = {
            pk: 'USER#user-123',
            sk: 'LOG#log-abc',
            content: 'Updated content',
            markers: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-05-12T00:00:00.000Z',
        }
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: updated })

        const result = await handler(mockEvent('user-123', 'log-abc', validBody)) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual(updated)
    })

    it('updates the correct DynamoDB key', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: {} })

        await handler(mockEvent('user-123', 'log-abc', validBody))

        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    Key: { pk: 'USER#user-123', sk: 'LOG#log-abc' },
                }),
            })
        )
    })

    it('always sets updatedAt in the update expression', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: {} })

        await handler(mockEvent('user-123', 'log-abc', validBody))

        const call = vi.mocked(dynamo.send).mock.calls.find(c =>
            c[0].input.UpdateExpression?.includes('updatedAt')
        )
        expect(call).toBeDefined()
        expect(call![0].input.ExpressionAttributeValues[':updatedAt']).toBeDefined()
    })

    it('removes title, trailId, and waypointId when not provided', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: {} })

        await handler(mockEvent('user-123', 'log-abc', { content: 'Content only', markerIds: [] }))

        const call = vi.mocked(dynamo.send).mock.calls.find(c =>
            c[0].input.UpdateExpression?.includes('REMOVE')
        )
        expect(call).toBeDefined()
        expect(call![0].input.UpdateExpression).toContain('title')
        expect(call![0].input.UpdateExpression).toContain('trailId')
        expect(call![0].input.UpdateExpression).toContain('waypointId')
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('user-123', 'log-abc', validBody)) as any
        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
