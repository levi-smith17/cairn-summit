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
            path: '/cache/carry-over',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'POST /cache/carry-over',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /cache/carry-over',
    rawPath: '/cache/carry-over',
    rawQueryString: '',
    headers: {},
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('cache/carry-over handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('carries over previous month budgets and returns count', async () => {
        const prevMonthItems = [
            { pk: 'USER#user-123', sk: 'CACHE#marker-1#4#2026', id: 'cache-1', markerId: 'marker-1', markerName: 'Marker 1', limit: 1000, month: 4, year: 2026 },
            { pk: 'USER#user-123', sk: 'CACHE#marker-2#4#2026', id: 'cache-2', markerId: 'marker-2', markerName: 'Marker 2', limit: 2000, month: 4, year: 2026 },
        ]
        const currentMonthItems = [
            { pk: 'USER#user-123', sk: 'CACHE#marker-1#5#2026', id: 'cache-3', markerId: 'marker-1', limit: 1500, month: 5, year: 2026 },
        ]
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: prevMonthItems })
            .mockResolvedValueOnce({ Items: currentMonthItems })
            .mockResolvedValueOnce({})

        const result = await handler(
            mockEvent('user-123', { month: 5, year: 2026 })
        ) as any

        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.count).toBe(1) // Only marker-2 should be carried over
    })

    it('returns count 0 when no items to carry over', async () => {
        const prevMonthItems = [
            { pk: 'USER#user-123', sk: 'CACHE#marker-1#4#2026', id: 'cache-1', markerId: 'marker-1', limit: 1000, month: 4, year: 2026 },
        ]
        const currentMonthItems = [
            { pk: 'USER#user-123', sk: 'CACHE#marker-1#5#2026', id: 'cache-2', markerId: 'marker-1', limit: 1500, month: 5, year: 2026 },
        ]
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: prevMonthItems })
            .mockResolvedValueOnce({ Items: currentMonthItems })

        const result = await handler(
            mockEvent('user-123', { month: 5, year: 2026 })
        ) as any

        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.count).toBe(0)
    })

    it('handles year rollover from January to December', async () => {
        const prevMonthItems = [
            { pk: 'USER#user-123', sk: 'CACHE#marker-1#12#2025', id: 'cache-1', markerId: 'marker-1', markerName: 'Marker 1', limit: 1000, month: 12, year: 2025 },
        ]
        const currentMonthItems: any[] = []
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: prevMonthItems })
            .mockResolvedValueOnce({ Items: currentMonthItems })
            .mockResolvedValueOnce({})

        const result = await handler(
            mockEvent('user-123', { month: 1, year: 2026 })
        ) as any

        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.count).toBe(1)
    })

    it('returns 400 when month is missing', async () => {
        const result = await handler(
            mockEvent('user-123', { year: 2026 })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('month and year are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when year is missing', async () => {
        const result = await handler(
            mockEvent('user-123', { month: 5 })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('month and year are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')))

        const result = await handler(
            mockEvent('user-123', { month: 5, year: 2026 })
        ) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})