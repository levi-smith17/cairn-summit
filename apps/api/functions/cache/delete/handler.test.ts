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
    pathParams: Record<string, string>
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
            method: 'DELETE',
            path: '/cache/cache-123',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'DELETE /cache/{id}',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'DELETE /cache/{id}',
    rawPath: '/cache/cache-123',
    rawQueryString: '',
    headers: {},
    pathParameters: pathParams,
    isBase64Encoded: false,
})

describe('cache/delete handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('deletes a cache and returns 204', async () => {
        const mockItems = [
            { pk: 'USER#user-123', sk: 'CACHE#marker-456#5#2026', id: 'cache-123', markerId: 'marker-456', limit: 1000, month: 5, year: 2026 },
        ]
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: mockItems })
            .mockResolvedValueOnce({})

        const result = await handler(
            mockEvent('user-123', { id: 'cache-123' })
        ) as any

        expect(result.statusCode).toBe(204)
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(
            mockEvent('user-123', {})
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing cache id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 404 when cache not found', async () => {
        vi.mocked(dynamo.send).mockResolvedValue({ Items: [] })

        const result = await handler(
            mockEvent('user-123', { id: 'cache-123' })
        ) as any

        expect(result.statusCode).toBe(404)
        expect(JSON.parse(result.body).error).toBe('Cache not found')
    })

    it('returns 500 when DynamoDB throws on query', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')))

        const result = await handler(
            mockEvent('user-123', { id: 'cache-123' })
        ) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })

    it('returns 500 when DynamoDB throws on delete', async () => {
        const mockItems = [
            { pk: 'USER#user-123', sk: 'CACHE#marker-456#5#2026', id: 'cache-123', markerId: 'marker-456', limit: 1000, month: 5, year: 2026 },
        ]
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: mockItems })
            .mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')))

        const result = await handler(
            mockEvent('user-123', { id: 'cache-123' })
        ) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})