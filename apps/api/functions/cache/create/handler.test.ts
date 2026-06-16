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
    body: Record<string, unknown>
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
            method: 'POST',
            path: '/cache',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'POST /cache',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /cache',
    rawPath: '/cache',
    rawQueryString: '',
    headers: {},
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('cache/create handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('stores markerName from marker record when not provided', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({
                Responses: {
                    'cairn-test': [{
                        pk: 'USER#user-123',
                        sk: 'MARKER#marker-456',
                        name: 'Provisions/Dining',
                        color: '#3b82f6',
                    }],
                },
            })
            .mockResolvedValueOnce({})

        const result = await handler(
            mockEvent('user-123', { markerId: 'marker-456', limit: 1000, month: 5, year: 2026 }),
        ) as any

        expect(result.statusCode).toBe(201)
        expect(JSON.parse(result.body).data.markerName).toBe('Provisions/Dining')
    })

    it('creates a cache and returns 201', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Responses: { 'cairn-test': [] } })
            .mockResolvedValueOnce({})

        const result = await handler(
            mockEvent('user-123', { markerId: 'marker-456', limit: 1000, month: 5, year: 2026 })
        ) as any

        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.markerId).toBe('marker-456')
        expect(data.limit).toBe(1000)
        expect(data.month).toBe(5)
        expect(data.year).toBe(2026)
        expect(data.pk).toBe('USER#user-123')
        expect(data.sk).toMatch(/^CACHE#marker-456#5#2026/)
        expect(data.id).toBeDefined()
    })

    it('creates a cache with optional markerName', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Responses: { 'cairn-test': [] } })
            .mockResolvedValueOnce({})

        const result = await handler(
            mockEvent('user-123', { markerId: 'marker-456', markerName: 'Test Marker', limit: 500, month: 6, year: 2026 })
        ) as any

        expect(result.statusCode).toBe(201)
        expect(JSON.parse(result.body).data.markerName).toBe('Test Marker')
    })

    it('returns 400 when markerId is missing', async () => {
        const result = await handler(
            mockEvent('user-123', { limit: 1000, month: 5, year: 2026 })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('markerId, limit, month, and year are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when limit is missing', async () => {
        const result = await handler(
            mockEvent('user-123', { markerId: 'marker-456', month: 5, year: 2026 })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('markerId, limit, month, and year are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when month is missing', async () => {
        const result = await handler(
            mockEvent('user-123', { markerId: 'marker-456', limit: 1000, year: 2026 })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('markerId, limit, month, and year are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when year is missing', async () => {
        const result = await handler(
            mockEvent('user-123', { markerId: 'marker-456', limit: 1000, month: 5 })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('markerId, limit, month, and year are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')))

        const result = await handler(
            mockEvent('user-123', { markerId: 'marker-456', limit: 1000, month: 5, year: 2026 })
        ) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})