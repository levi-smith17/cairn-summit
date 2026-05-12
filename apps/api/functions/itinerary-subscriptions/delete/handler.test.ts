import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (id: string | undefined): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'DELETE', path: `/itinerary-subscriptions/${id}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'DELETE /itinerary-subscriptions/{id}', stage: 'dev', time: '', timeEpoch: 0,
        authorizer: { jwt: { claims: { sub: 'user-123' }, scopes: [] } },
    },
    version: '2.0',
    routeKey: 'DELETE /itinerary-subscriptions/{id}',
    rawPath: `/itinerary-subscriptions/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    isBase64Encoded: false,
})

describe('itinerary-subscriptions/delete handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent(undefined)) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns 204 on success', async () => {
        const result = await handler(mockEvent('sub-1')) as any
        expect(result.statusCode).toBe(204)

        const deleteCall = vi.mocked(dynamo.send).mock.calls[0][0]
        expect(deleteCall.input.Key.sk).toBe('ITINERARY_SUB#sub-1')
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('sub-1')) as any
        expect(result.statusCode).toBe(500)
    })
})
