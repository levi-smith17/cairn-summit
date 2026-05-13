import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (body: object): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'POST', path: '/itinerary-subscriptions', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'POST /itinerary-subscriptions', stage: 'dev', time: '', timeEpoch: 0,
        authorizer: { jwt: { claims: { sub: 'user-123' }, scopes: [] } },
    },
    version: '2.0',
    routeKey: 'POST /itinerary-subscriptions',
    rawPath: '/itinerary-subscriptions',
    rawQueryString: '',
    headers: {},
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('itinerary-subscriptions/create handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when required fields are missing', async () => {
        const result = await handler(mockEvent({ name: 'Holidays' })) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns 201 with subscription id and defaults', async () => {
        const result = await handler(mockEvent({ name: 'Holidays', url: 'https://example.com/holidays.ics' })) as any
        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.id).toBeDefined()
        expect(data.name).toBe('Holidays')
        expect(data.color).toBe('#34C759')
        expect(data.syncEnabled).toBe(true)
    })

    it('writes item with CAL_SUB# sk prefix', async () => {
        await handler(mockEvent({ name: 'Holidays', url: 'https://example.com/holidays.ics' }))

        const putCall = vi.mocked(dynamo.send).mock.calls[0][0]
        expect(putCall.input.Item.sk).toMatch(/^ITINERARY_SUB#/)
        expect(putCall.input.Item.url).toBe('https://example.com/holidays.ics')
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent({ name: 'Holidays', url: 'https://example.com/holidays.ics' })) as any
        expect(result.statusCode).toBe(500)
    })
})
