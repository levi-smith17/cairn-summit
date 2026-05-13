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
    queryParams?: Record<string, string>
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
            path: '/supplylines',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'GET /supplylines',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /supplylines',
    rawPath: '/supplylines',
    rawQueryString: '',
    headers: {},
    queryStringParameters: queryParams,
    isBase64Encoded: false,
})

describe('supplylines/get handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns all supplylines', async () => {
        const mockItems = [
            {
                pk: 'USER#user-123',
                sk: 'SUPPLYLINE#supplyline-1',
                name: 'Netflix',
                amount: 15.99,
                billingCycle: 'MONTHLY',
                nextRenewal: '2026-06-01',
                active: true,
                markers: [],
                createdAt: '2026-01-01T00:00:00.000Z'
            },
            {
                pk: 'USER#user-123',
                sk: 'SUPPLYLINE#supplyline-2',
                name: 'Spotify',
                amount: 9.99,
                billingCycle: 'MONTHLY',
                nextRenewal: '2026-06-15',
                active: false,
                markers: [{ id: 'marker-1', name: 'Entertainment', color: '#FF0000' }],
                createdAt: '2026-01-01T00:00:00.000Z'
            },
        ]
        vi.mocked(dynamo.send).mockResolvedValue({ Items: mockItems })

        const result = await handler(mockEvent('user-123')) as any

        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data).toHaveLength(2)
        expect(data[0].id).toBe('supplyline-1')
        expect(data[0].name).toBe('Netflix')
        expect(data[1].id).toBe('supplyline-2')
        expect(data[1].name).toBe('Spotify')
    })

    it('filters by search term', async () => {
        const mockItems = [
            {
                pk: 'USER#user-123',
                sk: 'SUPPLYLINE#supplyline-1',
                name: 'Netflix',
                amount: 15.99,
                billingCycle: 'MONTHLY',
                nextRenewal: '2026-06-01',
                active: true,
                markers: [],
                createdAt: '2026-01-01T00:00:00.000Z'
            },
            {
                pk: 'USER#user-123',
                sk: 'SUPPLYLINE#supplyline-2',
                name: 'Spotify',
                amount: 9.99,
                billingCycle: 'MONTHLY',
                nextRenewal: '2026-06-15',
                active: true,
                markers: [],
                createdAt: '2026-01-01T00:00:00.000Z'
            },
        ]
        vi.mocked(dynamo.send).mockResolvedValue({ Items: mockItems })

        const result = await handler(mockEvent('user-123', { search: 'net' })) as any

        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data).toHaveLength(1)
        expect(data[0].name).toBe('Netflix')
    })

    it('filters by markerId', async () => {
        const mockItems = [
            {
                pk: 'USER#user-123',
                sk: 'SUPPLYLINE#supplyline-1',
                name: 'Netflix',
                amount: 15.99,
                billingCycle: 'MONTHLY',
                nextRenewal: '2026-06-01',
                active: true,
                markers: [{ id: 'marker-1', name: 'Entertainment', color: '#FF0000' }],
                createdAt: '2026-01-01T00:00:00.000Z'
            },
            {
                pk: 'USER#user-123',
                sk: 'SUPPLYLINE#supplyline-2',
                name: 'Spotify',
                amount: 9.99,
                billingCycle: 'MONTHLY',
                nextRenewal: '2026-06-15',
                active: true,
                markers: [],
                createdAt: '2026-01-01T00:00:00.000Z'
            },
        ]
        vi.mocked(dynamo.send).mockResolvedValue({ Items: mockItems })

        const result = await handler(mockEvent('user-123', { markerId: 'marker-1' })) as any

        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data).toHaveLength(1)
        expect(data[0].name).toBe('Netflix')
    })

    it('filters by active status', async () => {
        const mockItems = [
            {
                pk: 'USER#user-123',
                sk: 'SUPPLYLINE#supplyline-1',
                name: 'Netflix',
                amount: 15.99,
                billingCycle: 'MONTHLY',
                nextRenewal: '2026-06-01',
                active: true,
                markers: [],
                createdAt: '2026-01-01T00:00:00.000Z'
            },
            {
                pk: 'USER#user-123',
                sk: 'SUPPLYLINE#supplyline-2',
                name: 'Spotify',
                amount: 9.99,
                billingCycle: 'MONTHLY',
                nextRenewal: '2026-06-15',
                active: false,
                markers: [],
                createdAt: '2026-01-01T00:00:00.000Z'
            },
        ]
        vi.mocked(dynamo.send).mockResolvedValue({ Items: mockItems })

        const result = await handler(mockEvent('user-123', { active: 'true' })) as any

        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data).toHaveLength(1)
        expect(data[0].name).toBe('Netflix')
    })

    it('applies multiple filters', async () => {
        const mockItems = [
            {
                pk: 'USER#user-123',
                sk: 'SUPPLYLINE#supplyline-1',
                name: 'Netflix',
                amount: 15.99,
                billingCycle: 'MONTHLY',
                nextRenewal: '2026-06-01',
                active: true,
                markers: [{ id: 'marker-1', name: 'Entertainment', color: '#FF0000' }],
                createdAt: '2026-01-01T00:00:00.000Z'
            },
            {
                pk: 'USER#user-123',
                sk: 'SUPPLYLINE#supplyline-2',
                name: 'Spotify',
                amount: 9.99,
                billingCycle: 'MONTHLY',
                nextRenewal: '2026-06-15',
                active: true,
                markers: [{ id: 'marker-1', name: 'Entertainment', color: '#FF0000' }],
                createdAt: '2026-01-01T00:00:00.000Z'
            },
        ]
        vi.mocked(dynamo.send).mockResolvedValue({ Items: mockItems })

        const result = await handler(mockEvent('user-123', { search: 'net', markerId: 'marker-1', active: 'true' })) as any

        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data).toHaveLength(1)
        expect(data[0].name).toBe('Netflix')
    })

    it('returns empty array when no supplylines match', async () => {
        vi.mocked(dynamo.send).mockResolvedValue({ Items: [] })

        const result = await handler(mockEvent('user-123')) as any

        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data).toHaveLength(0)
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')))

        const result = await handler(mockEvent('user-123')) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})