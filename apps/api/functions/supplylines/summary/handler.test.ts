import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
            path: '/supplylines/summary',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'GET /supplylines/summary',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /supplylines/summary',
    rawPath: '/supplylines/summary',
    rawQueryString: '',
    headers: {},
    queryStringParameters: queryParams,
    isBase64Encoded: false,
})

describe('supplylines/summary handler', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-05-14T00:00:00.000Z'))
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('returns summary with monthly costs and upcoming renewals', async () => {
        const mockSupplylines = [
            {
                pk: 'USER#user-123',
                sk: 'SUPPLYLINE#supplyline-1',
                name: 'Netflix',
                amount: 15.99,
                billingCycle: 'MONTHLY',
                nextRenewal: '2026-05-15T00:00:00.000Z',
                active: true,
                markers: []
            },
            {
                pk: 'USER#user-123',
                sk: 'SUPPLYLINE#supplyline-2',
                name: 'Spotify',
                amount: 120,
                billingCycle: 'ANNUALLY',
                nextRenewal: '2026-12-01T00:00:00.000Z',
                active: true,
                markers: []
            },
            {
                pk: 'USER#user-123',
                sk: 'SUPPLYLINE#supplyline-3',
                name: 'Inactive Service',
                amount: 10,
                billingCycle: 'MONTHLY',
                nextRenewal: '2026-05-10T00:00:00.000Z',
                active: false,
                markers: []
            },
        ]
        const mockBurns = [
            {
                pk: 'USER#user-123',
                sk: 'BURN#burn-1',
                date: '2026-05-01',
                amount: 50,
                markers: [{ id: 'marker-1', name: 'Food', color: '#FF0000' }]
            },
            {
                pk: 'USER#user-123',
                sk: 'BURN#burn-2',
                date: '2026-05-15',
                amount: 25,
                markers: []
            },
        ]
        const mockCaches = [
            {
                pk: 'USER#user-123',
                sk: 'CACHE#marker-1#5#2026',
                id: 'cache-1',
                markerId: 'marker-1',
                markerName: 'Food',
                limit: 200,
                month: 5,
                year: 2026
            },
        ]

        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: mockSupplylines })
            .mockResolvedValueOnce({ Items: mockBurns })
            .mockResolvedValueOnce({ Items: mockCaches })

        const result = await handler(
            mockEvent('user-123', { month: '5', year: '2026' })
        ) as any

        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data

        // Monthly supplyline cost: Netflix (15.99) + Spotify (120/12 = 10) = 25.99
        expect(data.summary.monthlySupplylineCost).toBeCloseTo(25.99, 2)
        expect(data.summary.totalBurn).toBe(75) // 50 + 25
        expect(data.summary.totalMonthSpend).toBeCloseTo(100.99, 2) // 25.99 + 75
        expect(data.summary.activeSupplylines).toBe(2)

        expect(data.upcomingRenewals).toHaveLength(1)
        expect(data.upcomingRenewals[0].name).toBe('Netflix')

        expect(data.cacheUtilization).toHaveLength(1)
        expect(data.cacheUtilization[0].markerId).toBe('marker-1')
        expect(data.cacheUtilization[0].limit).toBe(200)
        expect(data.cacheUtilization[0].spent).toBe(50)
        expect(data.cacheUtilization[0].utilization).toBe(25)
        expect(data.cacheUtilization[0].marker.name).toBe('Food')
    })

    it('handles different billing cycles correctly', async () => {
        const mockSupplylines = [
            {
                pk: 'USER#user-123',
                sk: 'SUPPLYLINE#supplyline-1',
                name: 'Weekly Service',
                amount: 50,
                billingCycle: 'WEEKLY',
                nextRenewal: '2026-06-01T00:00:00.000Z',
                active: true,
                markers: []
            },
            {
                pk: 'USER#user-123',
                sk: 'SUPPLYLINE#supplyline-2',
                name: 'Biweekly Service',
                amount: 100,
                billingCycle: 'BIWEEKLY',
                nextRenewal: '2026-06-01T00:00:00.000Z',
                active: true,
                markers: []
            },
            {
                pk: 'USER#user-123',
                sk: 'SUPPLYLINE#supplyline-3',
                name: 'Quarterly Service',
                amount: 300,
                billingCycle: 'QUARTERLY',
                nextRenewal: '2026-06-01T00:00:00.000Z',
                active: true,
                markers: []
            },
        ]

        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: mockSupplylines })
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(
            mockEvent('user-123', { month: '5', year: '2026' })
        ) as any

        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data

        // Weekly: 50 * 52 / 12 = ~216.67
        // Biweekly: 100 * 26 / 12 = ~216.67
        // Quarterly: 300 / 3 = 100
        // Total: ~533.33
        expect(data.summary.monthlySupplylineCost).toBeCloseTo(533.33, 2)
    })

    it('returns empty arrays when no data', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(
            mockEvent('user-123', { month: '5', year: '2026' })
        ) as any

        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.summary.monthlySupplylineCost).toBe(0)
        expect(data.summary.totalBurn).toBe(0)
        expect(data.summary.totalMonthSpend).toBe(0)
        expect(data.summary.activeSupplylines).toBe(0)
        expect(data.upcomingRenewals).toHaveLength(0)
        expect(data.cacheUtilization).toHaveLength(0)
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