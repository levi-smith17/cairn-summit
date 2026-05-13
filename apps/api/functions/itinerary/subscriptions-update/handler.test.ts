import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (id: string | undefined, body: object): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'PUT', path: `/itinerary-subscriptions/${id}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'PUT /itinerary-subscriptions/{id}', stage: 'dev', time: '', timeEpoch: 0,
        authorizer: { jwt: { claims: { sub: 'user-123' }, scopes: [] } },
    },
    version: '2.0',
    routeKey: 'PUT /itinerary-subscriptions/{id}',
    rawPath: `/itinerary-subscriptions/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('itinerary-subscriptions/update handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent(undefined, { name: 'X' })) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns 400 when no valid fields provided', async () => {
        const result = await handler(mockEvent('sub-1', { unknownField: 'foo' })) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns 200 with updated subscription', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({
            Attributes: { pk: 'USER#user-123', sk: 'ITINERARY_SUB#sub-1', name: 'US Holidays', url: 'https://example.com/us.ics' }
        })

        const result = await handler(mockEvent('sub-1', { name: 'US Holidays' })) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data.id).toBe('sub-1')
    })

    it('returns 404 when subscription does not exist', async () => {
        const err = new Error('ConditionalCheckFailedException')
        err.name = 'ConditionalCheckFailedException'
        vi.mocked(dynamo.send).mockRejectedValueOnce(err)

        const result = await handler(mockEvent('bad-id', { name: 'X' })) as any
        expect(result.statusCode).toBe(404)
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('sub-1', { name: 'X' })) as any
        expect(result.statusCode).toBe(500)
    })
})
