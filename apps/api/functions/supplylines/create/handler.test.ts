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
            path: '/supplylines',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'POST /supplylines',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /supplylines',
    rawPath: '/supplylines',
    rawQueryString: '',
    headers: {},
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('supplylines/create handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('creates a supplyline and returns 201', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({}) // PutCommand

        const result = await handler(
            mockEvent('user-123', {
                name: 'Netflix',
                amount: 15.99,
                billingCycle: 'MONTHLY',
                nextRenewal: '2026-06-01',
                markerIds: []
            })
        ) as any

        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.name).toBe('Netflix')
        expect(data.amount).toBe(15.99)
        expect(data.billingCycle).toBe('MONTHLY')
        expect(data.nextRenewal).toBe('2026-06-01')
        expect(data.pk).toBe('USER#user-123')
        expect(data.sk).toMatch(/^SUPPLYLINE#/)
        expect(data.id).toBeDefined()
        expect(data.active).toBe(true)
        expect(data.markers).toEqual([])
    })

    it('creates a supplyline with markers', async () => {
        const mockMarkers = [
            { pk: 'USER#user-123', sk: 'MARKER#marker-1', name: 'Entertainment', color: '#FF0000' },
            { pk: 'USER#user-123', sk: 'MARKER#marker-2', name: 'Bills', color: '#00FF00', icon: 'dollar' },
        ]
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Responses: { 'cairn-test': mockMarkers } }) // BatchGetCommand for markers
            .mockResolvedValueOnce({}) // PutCommand

        const result = await handler(
            mockEvent('user-123', {
                name: 'Netflix',
                amount: 15.99,
                billingCycle: 'MONTHLY',
                nextRenewal: '2026-06-01',
                markerIds: ['marker-1', 'marker-2']
            })
        ) as any

        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.markers).toHaveLength(2)
        expect(data.markers[0]).toEqual({ id: 'marker-1', name: 'Entertainment', color: '#FF0000' })
        expect(data.markers[1]).toEqual({ id: 'marker-2', name: 'Bills', color: '#00FF00', icon: 'dollar' })
    })

    it('creates a supplyline with optional fields', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({}) // PutCommand

        const result = await handler(
            mockEvent('user-123', {
                name: 'Spotify',
                amount: 9.99,
                billingCycle: 'MONTHLY',
                nextRenewal: '2026-06-01',
                url: 'https://spotify.com',
                notes: 'Premium plan',
                active: false
            })
        ) as any

        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.url).toBe('https://spotify.com')
        expect(data.notes).toBe('Premium plan')
        expect(data.active).toBe(false)
    })

    it('returns 400 when name is missing', async () => {
        const result = await handler(
            mockEvent('user-123', { amount: 15.99, billingCycle: 'MONTHLY', nextRenewal: '2026-06-01' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('name, amount, billingCycle, and nextRenewal are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when amount is missing', async () => {
        const result = await handler(
            mockEvent('user-123', { name: 'Netflix', billingCycle: 'MONTHLY', nextRenewal: '2026-06-01' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('name, amount, billingCycle, and nextRenewal are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when billingCycle is missing', async () => {
        const result = await handler(
            mockEvent('user-123', { name: 'Netflix', amount: 15.99, nextRenewal: '2026-06-01' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('name, amount, billingCycle, and nextRenewal are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when nextRenewal is missing', async () => {
        const result = await handler(
            mockEvent('user-123', { name: 'Netflix', amount: 15.99, billingCycle: 'MONTHLY' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('name, amount, billingCycle, and nextRenewal are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')))

        const result = await handler(
            mockEvent('user-123', {
                name: 'Netflix',
                amount: 15.99,
                billingCycle: 'MONTHLY',
                nextRenewal: '2026-06-01'
            })
        ) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})