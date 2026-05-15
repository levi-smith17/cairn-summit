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
    queryParams: Record<string, string>
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
            method: 'GET',
            path: '/cache',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'GET /cache',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /cache',
    rawPath: '/cache',
    rawQueryString: '',
    headers: {},
    queryStringParameters: queryParams,
    isBase64Encoded: false,
})

describe('cache/get handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns cache items for the specified month and year', async () => {
        const mockItems = [
            { pk: 'USER#user-123', sk: 'CACHE#marker-1#5#2026', id: 'cache-1', markerId: 'marker-1', limit: 1000, month: 5, year: 2026 },
            { pk: 'USER#user-123', sk: 'CACHE#marker-2#5#2026', id: 'cache-2', markerId: 'marker-2', limit: 2000, month: 5, year: 2026 },
            { pk: 'USER#user-123', sk: 'CACHE#marker-3#6#2026', id: 'cache-3', markerId: 'marker-3', limit: 1500, month: 6, year: 2026 },
        ]
        vi.mocked(dynamo.send).mockResolvedValue({ Items: mockItems })

        const result = await handler(
            mockEvent('user-123', { month: '5', year: '2026' })
        ) as any

        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data).toHaveLength(2)
        expect(data[0].markerId).toBe('marker-1')
        expect(data[1].markerId).toBe('marker-2')
    })

    it('returns empty array when no cache items match', async () => {
        const mockItems = [
            { pk: 'USER#user-123', sk: 'CACHE#marker-1#6#2026', id: 'cache-1', markerId: 'marker-1', limit: 1000, month: 6, year: 2026 },
        ]
        vi.mocked(dynamo.send).mockResolvedValue({ Items: mockItems })

        const result = await handler(
            mockEvent('user-123', { month: '5', year: '2026' })
        ) as any

        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data).toHaveLength(0)
    })

    it('returns 400 when month is missing', async () => {
        const result = await handler(
            mockEvent('user-123', { year: '2026' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('month and year are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when year is missing', async () => {
        const result = await handler(
            mockEvent('user-123', { month: '5' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('month and year are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when month is not a number', async () => {
        const result = await handler(
            mockEvent('user-123', { month: 'abc', year: '2026' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('month and year must be numbers')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when year is not a number', async () => {
        const result = await handler(
            mockEvent('user-123', { month: '5', year: 'abc' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('month and year must be numbers')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')))

        const result = await handler(
            mockEvent('user-123', { month: '5', year: '2026' })
        ) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})