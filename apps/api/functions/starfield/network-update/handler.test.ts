import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (sub: string, id: string | undefined, body: Record<string, unknown>): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: { jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] }, principalId: '', integrationLatency: 0 },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'PUT', path: `/starfield/networks/${id}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'PUT /starfield/networks/{id}', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'PUT /starfield/networks/{id}', rawPath: `/starfield/networks/${id}`,
    rawQueryString: '', headers: {}, pathParameters: id ? { id } : undefined,
    body: JSON.stringify(body), isBase64Encoded: false,
})

describe('starfield/network-update handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('updates network and returns 200 with attributes', async () => {
        const updated = { pk: 'USER#user-1', sk: 'SF#NETWORK#net-1', name: 'Updated', abbreviation: 'UP' }
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: updated })

        const result = await handler(mockEvent('user-1', 'net-1', { name: 'Updated', abbreviation: 'UP' })) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual(updated)
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent('user-1', undefined, { name: 'X', abbreviation: 'X' })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing network id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when name is missing', async () => {
        const result = await handler(mockEvent('user-1', 'net-1', { abbreviation: 'AN' })) as any
        expect(result.statusCode).toBe(400)
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when abbreviation is missing', async () => {
        const result = await handler(mockEvent('user-1', 'net-1', { name: 'Alpha' })) as any
        expect(result.statusCode).toBe(400)
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('user-1', 'net-1', { name: 'Alpha', abbreviation: 'AL' })) as any
        expect(result.statusCode).toBe(500)
    })
})
